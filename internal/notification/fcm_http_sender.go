package notification

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"time"

	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"
)

// ErrFCMNotConfigured signals that no service-account credential is present, so
// callers should fall back to the stub sender (local dev / CI).
var ErrFCMNotConfigured = errors.New("fcm: FCM_SERVICE_ACCOUNT_FILE not set")

const fcmMessagingScope = "https://www.googleapis.com/auth/firebase.messaging"

// FCMHTTPSender delivers pushes via the FCM HTTP v1 API using a Firebase
// service-account credential. It implements FCMSender for both the rider
// notifier and the driver outbox daemon.
type FCMHTTPSender struct {
	projectID string
	tokenSrc  oauth2.TokenSource
	client    *http.Client
}

// NewFCMHTTPSenderFromEnv builds a sender from FCM_SERVICE_ACCOUNT_FILE (a
// Firebase service-account JSON path). Returns ErrFCMNotConfigured when the
// env var is unset so the caller can degrade to the stub without failing boot.
func NewFCMHTTPSenderFromEnv(ctx context.Context) (*FCMHTTPSender, error) {
	path := os.Getenv("FCM_SERVICE_ACCOUNT_FILE")
	if path == "" {
		return nil, ErrFCMNotConfigured
	}
	raw, err := os.ReadFile(path)
	if err != nil {
		return nil, fmt.Errorf("fcm: read service account file: %w", err)
	}

	cfg, err := google.JWTConfigFromJSON(raw, fcmMessagingScope)
	if err != nil {
		return nil, fmt.Errorf("fcm: parse service account: %w", err)
	}

	// The messages:send URL needs the project id, which lives in the same JSON.
	var meta struct {
		ProjectID string `json:"project_id"`
	}
	if err := json.Unmarshal(raw, &meta); err != nil || meta.ProjectID == "" {
		return nil, fmt.Errorf("fcm: service account missing project_id")
	}

	return &FCMHTTPSender{
		projectID: meta.ProjectID,
		tokenSrc:  cfg.TokenSource(ctx),
		client:    &http.Client{Timeout: 10 * time.Second},
	}, nil
}

// Send posts one message to one device token. A 404/UNREGISTERED (or 400 on a
// structurally invalid token) reports InvalidRegistration so callers can
// deactivate the token.
func (s *FCMHTTPSender) Send(ctx context.Context, token, _ /* platform */, title, body string, data []byte) (FCMResult, error) {
	msg := map[string]any{
		"message": map[string]any{
			"token": token,
			"notification": map[string]string{
				"title": title,
				"body":  body,
			},
		},
	}
	// FCM v1 data values must be strings; ship the JSON payload under one key.
	if len(data) > 0 {
		msg["message"].(map[string]any)["data"] = map[string]string{"payload": string(data)}
	}

	buf, err := json.Marshal(msg)
	if err != nil {
		return FCMResult{}, err
	}

	tok, err := s.tokenSrc.Token()
	if err != nil {
		return FCMResult{}, fmt.Errorf("fcm: oauth token: %w", err)
	}

	url := fmt.Sprintf("https://fcm.googleapis.com/v1/projects/%s/messages:send", s.projectID)
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewReader(buf))
	if err != nil {
		return FCMResult{}, err
	}
	req.Header.Set("Authorization", "Bearer "+tok.AccessToken)
	req.Header.Set("Content-Type", "application/json")

	resp, err := s.client.Do(req)
	if err != nil {
		return FCMResult{}, err
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusOK {
		return FCMResult{}, nil
	}

	respBody, _ := io.ReadAll(io.LimitReader(resp.Body, 4096))
	// UNREGISTERED (404) = token no longer valid; INVALID_ARGUMENT (400) covers
	// malformed tokens. Both mean this token will never work again.
	if resp.StatusCode == http.StatusNotFound || resp.StatusCode == http.StatusBadRequest {
		log.Printf("[FCM] dead token (%d): %s", resp.StatusCode, truncate(string(respBody), 200))
		return FCMResult{InvalidRegistration: true}, nil
	}
	return FCMResult{}, fmt.Errorf("fcm: send failed (%d): %s", resp.StatusCode, truncate(string(respBody), 200))
}

func truncate(s string, n int) string {
	if len(s) <= n {
		return s
	}
	return s[:n]
}
