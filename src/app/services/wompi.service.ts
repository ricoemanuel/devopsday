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
  async generarLink(valor:number, asientos:string, usuario:string, title: string) {
    const data = {
      "name": `Pago de ${title} con el 10% de descuento.`,
      "description": `Asientos del evento: ${asientos}. Código de usuario ${usuario}` ,
      "single_use": true,
      "currency": "COP",
      "amount_in_cents": valor*100,
      "collect_shipping": false,
      "collect_customer_legal_id": true,
      "redirect_url":"https://myticketeventos.web.app/mis-compras"
    };
    return this.http.post(`${environment.wompi.link}payment_links`, data, { headers: this.headers })
    
  }
  async transacciones(id:string){
    return this.http.get(`https://production.wompi.co/v1/transactions/${id}`)
  }
}
