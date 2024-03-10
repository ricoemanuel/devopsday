import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
@Injectable({
  providedIn: 'root'
})
export class WompiService {
  headers = new HttpHeaders({
    'content-Type': 'application/json',
    'authorization': `Bearer ${environment.wompi.head}`
  });
  constructor(private http: HttpClient) { }
  async generarLink(valor:number, usuario:string, description:string) {
    const data = {
      "name": `Pago DevOpsDays Medellín 2024`,
      "description": `${description} usuario: ${usuario}`,
      "single_use": true,
      "currency": "COP",
      "amount_in_cents": 1500*100,
      "collect_shipping": false,
      "collect_customer_legal_id": true,
      "redirect_url":"https://pagos-devopsday.web.app/mis-compras"
    };
    return this.http.post(`${environment.wompi.link}payment_links`, data, { headers: this.headers })
    
  }
  async transacciones(id:string){
    return this.http.get(`https://production.wompi.co/v1/transactions/${id}`)
  }
}
