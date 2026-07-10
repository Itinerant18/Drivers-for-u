export interface Order {
  id: string;
  riderName: string;
  pickupAddress: string;
  dropAddress: string;
  eta: number;
  tripType: 'CITY' | 'OUTSTATION' | 'MINI_OUTSTATION';
  carType: 'SEDAN' | 'SUV' | 'HATCH';
}
