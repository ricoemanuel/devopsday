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
          if (datos) {
            this.verificar(datos.data.reference.split("_")[0])
          }
        })

      }


    })
    this.firebase.getAuthState().subscribe(user => {
      if(!user){
        this.router.navigate(['/evento/'])
      }
      this.firebase.getCurrentFacturas(user!.uid).subscribe(res => {
        this.data = res
        this.data.forEach(async (factura: any) => {
          if (factura.estado === 'pagando') {
            await this.verificar(factura.link)
          }

        })
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
        pdf.save(`devopsday-${id}`);
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


  async verificar(link: string) {
    let resfactura = await this.firebase.getFactura(link)
    let factura: any
    let id: any
    resfactura.forEach((reserva: any) => {
      id = reserva.id
      factura = reserva.data()

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
          factura.estado = "comprado"
          await this.firebase.actualizarFactura(factura, id)
          Swal.fire({
            position: 'top-end',
            icon: 'success',
            title: 'Has comprado tú entrada!',
            showConfirmButton: false,
            timer: 3000
          })
        } else if (datos.transaction.status === 'DECLINED') {
          factura.transaccion = datos
          factura.estado = "cancelado"
          await this.firebase.actualizarFactura(factura, id)
          Swal.fire({
            position: 'top-end',
            icon: 'error',
            title: 'La transacción ha sido rechazada, comunícate con tu banco.',
            showConfirmButton: false,
            timer: 2000
          })
        }
        else {

          
        }

      } else {

       
      }
    })
  }
}
