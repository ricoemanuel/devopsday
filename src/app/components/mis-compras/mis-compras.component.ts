import { Component, ElementRef, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { FirebaseService } from 'src/app/services/firebase.service';
import * as QRCode from 'qrcode-generator';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { ActivatedRoute, Router } from '@angular/router';
import Swal from 'sweetalert2';
import { WompiService } from 'src/app/services/wompi.service';
@Component({
  selector: 'app-mis-compras',
  templateUrl: './mis-compras.component.html',
  styleUrls: ['./mis-compras.component.scss']
})
export class MisComprasComponent implements OnInit {
  data: any[] = []
  baseSeleccionada = ""
  @ViewChild(MatPaginator, { static: true }) paginator!: MatPaginator;
  @ViewChild('content', { static: false }) content!: ElementRef;
  idTranssaccion: any;
  constructor(private wompi: WompiService, private firebase: FirebaseService, private modalService: BsModalService, private router: Router, private route: ActivatedRoute,) {

  }

  async ngOnInit(): Promise<void> {
    this.route.queryParams.subscribe(async params => {
      this.idTranssaccion = params['id']
      if (this.idTranssaccion) {
       
        let res = await this.wompi.transacciones(this.idTranssaccion)
        res.subscribe(async (datos: any) => {
          if(datos){
            //console.log(datos)
            this.verificar(datos.data.reference.split("_")[0])
          }
        })
      }

    })
    this.firebase.getAuthState().subscribe(user => {
      this.firebase.getCurrentFacturas(user!.uid).subscribe(res => {
        res = res.filter((factura: any) => {
          if (factura.eventoData) {
            if(factura.estado){
              return factura.eventoData.nombre.split(" ")[0] === "Innovación" && factura.asientos.length > 0 && factura.estado!=='cancelado'
            }else{
              return factura.eventoData.nombre.split(" ")[0] === "Innovación" && factura.asientos.length > 0
            }
            
          } else {
            return false
          }
        })
        this.data = res
        //console.log(this.data)
      })
    })
  }
  generarPDF(id: string) {
    const content = document.getElementById(id); // Reemplaza 'pdfContent' con el ID de tu elemento HTML

    if (content) {
      const contentWidth = content.offsetWidth;
      const contentHeight = content.offsetHeight;
      const reduccion = 0.25;
      const pdfWidth = contentWidth * reduccion;
      const pdfHeight = contentHeight * reduccion;

      html2canvas(content).then((canvas) => {
        const pdf = new jsPDF('p', 'mm', [pdfWidth, pdfHeight]);
        const imgData = canvas.toDataURL('image/png');
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`innovacion-${id}`);
      });
    } else {
      console.error('No se encontró el elemento con el ID especificado.');
    }
  }

  generateQRCodeBase64(qrData: string) {
    const qr = QRCode(0, 'L');
    qr.addData(qrData);
    qr.make();
    return qr.createDataURL(10, 0);
  }

  openQR(codigo: string, template: TemplateRef<any>) {
    this.baseSeleccionada = codigo
    this.openModal(template)
  }
  modalRef?: BsModalRef;
  openModal(template: TemplateRef<any>) {

    this.modalRef = this.modalService.show(template);


  }
  formatAsientos(asientos: any[]) {
    let asientosString: string = ""
    asientos.forEach(asiento => {
      asientosString += (asiento.split("/")[1] + ', ')
    })
    return asientosString.slice(0, -2)
  }
  formatZonas(asientos: any[]) {
    let asientosString: string[] = []
    asientos.forEach(asiento => {
      asientosString.push(asiento.split(",")[0])
    })
    asientosString = asientosString.filter((item, index) => {
      return asientosString.indexOf(item) === index;
    })
    return asientosString
  }
  iterObject(elemento: any) {
    let claves = Object.keys(elemento)
    let asistentes: string = ""
    claves.forEach(clave => {
      asistentes += `<div class="col-md-4">${clave}<br>Niños: ${elemento[clave].ninos}<br>Adultos: ${elemento[clave].adultos}</div>`
    })
    return asistentes
  }
  async verificar(link: string) {
    let resfactura = await this.firebase.getFactura(link)

    let factura: any
    let id: any
    resfactura.forEach((reserva: any) => {
      id = reserva.id
      factura = reserva.data()

    })
    let asientos: string[] = []
    factura.asientos.map(async (asiento: any) => {
      asientos.push(asiento.split(",")[1].split("/")[0])
    })
    //console.log(asientos)
    Swal.fire({
      position: 'top-end',
      icon: 'info',
      title: 'Validando compra, por favor espere, Esto puede demorar un par de minutos',
      showConfirmButton: false,

    })

    this.firebase.transactions().subscribe(async res => {
      let iterable = Object.entries(res);
      let array: any[] = [];

      iterable.forEach(([key, transaccion]: any) => {
        transaccion.key = key;
        array.push(transaccion);
      });



      let respuesta = array.filter(pago => {
        return pago.data.transaction.payment_link_id === link
      })

      if (respuesta.length > 0) {
        let datos: any = respuesta[0].data
        if (datos.transaction.status === 'APPROVED') {
          factura.transaccion = datos
          asientos.forEach(async (doc: string) => {
            let docres = await this.firebase.getAsientoByDoc(doc)
            let asiento: any = docres.data()
            asiento.estado = "ocupado"
            asiento.clienteEstado = "pago"
            //console.log(asiento)
            await this.firebase.actualizarAsiento(asiento)
          })

          factura.estado = "comprado"
          await this.firebase.actualizarFactura(factura, id)
          Swal.fire({
            position: 'top-end',
            icon: 'success',
            title: 'Has comprado tú entrada!',
            showConfirmButton: false,
            timer: 3000
          })
        } else {
          factura.transaccion = datos
          factura.estado = "cancelado"
          asientos.forEach(async (doc: string) => {
            let docres = await this.firebase.getAsientoByDoc(doc)
            let asiento: any = docres.data()
            asiento.estado = "libre"
            asiento.clienteEstado = "null"
            asiento.clienteUser = "null"
            await this.firebase.actualizarAsiento(asiento)
          })
          await this.firebase.actualizarFactura(factura, id)
          Swal.fire({
            position: 'top-end',
            icon: 'error',
            title: 'La transacción ha sido rechazada, comunícate con tu banco.',
            showConfirmButton: false,
            timer: 2000
          })
        }

      } else {
        factura.estado = "cancelado"
        await this.firebase.actualizarFactura(factura, id)
        asientos.forEach(async (doc: string) => {
          let docres = await this.firebase.getAsientoByDoc(doc)
          let asiento: any = docres.data()
          asiento.estado = "libre"
          asiento.clienteEstado = "null"
          asiento.clienteUser = "null"
          await this.firebase.actualizarAsiento(asiento)
        })
        Swal.fire({
          position: 'top-end',
          icon: 'error',
          title: 'La transacción no ha sido confirmada, comunícate con tu banco.',
          showConfirmButton: false,
          timer: 2000
        })
      }
    })
  }
}
