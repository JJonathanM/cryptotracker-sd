export interface CryptoData {
  id: number;
  symbol: string;
  name: string;
  image_url: string;
  price: number;
  last_update: string;
}

export interface HistoricalPrice {
  price_time: string;
  price: number;
}

export interface CryptoHistoricalData {
  crypto_id: number;
  symbol: string;
  name: string;
  data: HistoricalPrice[];
}