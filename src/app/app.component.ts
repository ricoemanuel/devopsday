import { Component, ElementRef, HostListener, OnInit } from '@angular/core';
import { FirebaseService } from './services/firebase.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { WompiService } from './services/wompi.service';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  cargando: boolean = true
  login:boolean=false
  logged:boolean=false
  esAdmin:boolean=false
  constructor(private router: Router, private firebase: FirebaseService, private wompi: WompiService, private route: ActivatedRoute) { }
  ngOnInit(): void {
    
    this.firebase.getAuthState().subscribe(async res => {
      if (res) {
        this.logged=true
        res.uid==="NNcOSeH29sRCTw7LDqOlthXdg8E3"?this.esAdmin=true:this.esAdmin=false
      }
      this.cargando = false
    })
    this.router.events.subscribe((event: any) => {
      if(event.url){
        if(event.url==='/login'){
          this.login=true
        }
        else{
          this.login=false
        }
      }


  });

  }
  logout() {
    this.firebase.cerrarSesion()
    this.logged=false
  }
  redirect(){
    this.router.navigate(['login'])
  }
  redirectW(){
    const urlWhatsApp = 'https://api.whatsapp.com/send?phone=573054029445';
    window.open(urlWhatsApp, '_blank'); // Abre en una nueva ventana o pestaña
    // O puedes usar router.navigate para redirigir en la misma ventana
    // this.router.navigate(['/']); // Por ejemplo, redirigir a la página de inicio de tu aplicación Angular
  
  }
  // registrarBD(){
  //   let datos=[
  //     {
  //      "No.": 1,
  //      "Nombres": "Deisy Ríos",
  //      "Documento": 1005294355,
  //      "descuento": 0.5
  //     },
  //     {
  //      "No.": 2,
  //      "Nombres": "William Vera",
  //      "Documento": 1030562368,
  //      "descuento": 0.5
  //     },
  //     {
  //      "No.": 3,
  //      "Nombres": "María Juliana Vera",
  //      "Documento": 1015430267,
  //      "descuento": 0.5
  //     },
  //     {
  //      "No.": 4,
  //      "Nombres": "Daniel Fernando Verjan Hernández",
  //      "Documento": 1106781793,
  //      "descuento": 0.5
  //     },
  //     {
  //      "No.": 5,
  //      "Nombres": "Belkis Johana Basto Parra",
  //      "Documento": 1001324809,
  //      "descuento": 0.5
  //     },
  //     {
  //      "No.": 6,
  //      "Nombres": "María Fernanda Rendon Socarras",
  //      "Documento": 1030686017,
  //      "descuento": 0.5
  //     },
  //     {
  //      "No.": 7,
  //      "Nombres": "Nelly Johanna Castillo Beltrán",
  //      "Documento": 1032391055,
  //      "descuento": 0.5
  //     },
  //     {
  //      "No.": 8,
  //      "Nombres": "Ana María Botia Salcedo",
  //      "Documento": 1010077181,
  //      "descuento": 0.5
  //     },
  //     {
  //      "No.": 9,
  //      "Nombres": "Paula Andrea Bobadilla Sanabria",
  //      "Documento": 1000321417,
  //      "descuento": 0.5
  //     },
  //     {
  //      "No.": 10,
  //      "Nombres": "Lina Viviana Romero Osorio",
  //      "Documento": 1016026186,
  //      "descuento": 0.5
  //     },
  //     {
  //      "No.": 11,
  //      "Nombres": "Jeymi Carolina Briceño Pulecio",
  //      "Documento": 1019063665,
  //      "descuento": 0.5
  //     },
  //     {
  //      "No.": 12,
  //      "Nombres": "Luz Merlly Giraldo Tunjo",
  //      "Documento": 1012450143,
  //      "descuento": 0.5
  //     },
  //     {
  //      "No.": 13,
  //      "Nombres": "David Esteban González Teran",
  //      "Documento": 1014278821,
  //      "descuento": 0.5
  //     },
  //     {
  //      "No.": 14,
  //      "Nombres": "Claudia Milena González Rozo",
  //      "Documento": 1012345402,
  //      "descuento": 0.5
  //     },
  //     {
  //      "No.": 15,
  //      "Nombres": "Andrés Ricardo Botia Silva",
  //      "Documento": 1018421632,
  //      "descuento": 0.5
  //     },
  //     {
  //      "No.": 16,
  //      "Nombres": "Marcos Jhonattan Bohórquez Valero",
  //      "Documento": 1019152951,
  //      "descuento": 0.5
  //     },
  //     {
  //      "No.": 17,
  //      "Nombres": "John Sebastián Tovar Sánchez",
  //      "Documento": 1233892143,
  //      "descuento": 0.5
  //     },
  //     {
  //      "No.": 18,
  //      "Nombres": "Jair Alejandro Rozo Becerra",
  //      "Documento": 1000461076,
  //      "descuento": 0.5
  //     },
  //     {
  //      "No.": 19,
  //      "Nombres": "Jaya Sofía Bolivar Bernal",
  //      "Documento": 1000339023,
  //      "descuento": 0.5
  //     },
  //     {
  //      "No.": 20,
  //      "Nombres": "Margarita González Benítez",
  //      "Documento": 51864215,
  //      "descuento": 0.5
  //     },
  //     {
  //      "No.": 21,
  //      "Nombres": "Laura Juliana Valenzuela Cortes",
  //      "Documento": 1013672508,
  //      "descuento": 0.5
  //     },
  //     {
  //      "No.": 22,
  //      "Nombres": "Adriana Lucia Suarez",
  //      "Documento": 1095511437,
  //      "descuento": 0.5
  //     }
  //    ]
  //    datos.forEach(async (dato:any)=>{
  //     await this.firebase.setUserDescuento(dato)
  //    })
  // }

}
