import { Component, OnInit, TemplateRef, Pipe, PipeTransform, OnDestroy, ChangeDetectorRef, AfterViewInit, ElementRef, HostListener } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { DomSanitizer, SafeHtml, SafeResourceUrl, SafeScript, SafeStyle, SafeUrl } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { Subscription } from 'rxjs';
import { FirebaseService } from 'src/app/services/firebase.service';
import { WompiService } from 'src/app/services/wompi.service';
import Swal from 'sweetalert2';
@Component({
  selector: 'app-evento',
  templateUrl: './evento.component.html',
  styleUrls: ['./evento.component.scss']
})
export class EventoComponent implements OnInit {
  personForm: FormGroup;
  precios: any = {
    "Early Bird": {
      "persona": 249000,
      "combo": 449000 / 2,
      "estado": 'activo'
    },
  }
  codigos:any[]=[]
  constructor(private aRoute: ActivatedRoute,
    private firebase: FirebaseService,
    private modalService: BsModalService,
    private wompi: WompiService,
    protected _sanitizer: DomSanitizer,
    private cdRef: ChangeDetectorRef,
    private el: ElementRef, private router: Router,
    private formBuilder: FormBuilder) {
    this.personForm = this.formBuilder.group({
      numberOfPeople: ['', [Validators.required, Validators.min(1)]],
      may23: [false],
      may24: [false],
      codigo:['']
    });
  }

  current: any
  user: any
  uid!:string
  async ngOnInit(): Promise<void> {
    this.current = this.currentPrice()
    this.firebase.getAuthState().subscribe(async res => {
      if (res) {
        let userData=await this.firebase.getUser(res.uid)
        this.uid=res.uid
        this.user = userData
      }
    })
    this.firebase.getFacturasBycodigo().subscribe((res:any)=>{
     this.codigos=res
    })
  }
  currentPrice() {
    let currentPrice: any = {}
    Object.keys(this.precios).forEach((plan: any) => {
      if (this.precios[plan].estado === 'activo') {
        currentPrice = plan
      }
    })
    return currentPrice
  }
  formTab: boolean = false
  comprar() {
    if (this.user) {
      this.formTab = !this.formTab
    } else {
      this.router.navigate(['login'])
    }

  }
  disabled: boolean = false
  async pagar() {
    if (this.personForm.valid && (this.personForm.value.may23 || this.personForm.value.may24)) {
      this.disabled = true
      let numberOfPeople = this.personForm.value.numberOfPeople
      let may23 = this.personForm.value.may23
      let may24 = this.personForm.value.may24
      let price = this.precios[this.current].persona
      let description = `Pago de ${numberOfPeople} personas ${may23 && may24 ? 'Válido para 2 días, 23 y 24 de mayo' : may23 ? 'Válido para 1 día, 23 de mayo' : may24 ? 'Válido para 1 día, 24 de mayo' : null}`
      if (numberOfPeople >= 5 && may23 && may24) {
        price = this.precios[this.current].combo
      }
      let valor = numberOfPeople * price * (may23 && may24 ? 2 : 1)
      if(this.codigos.length<=50){
        valor=valor-(this.personForm.value.codigo==="CoDevospDays2024"?valor*(20/100):0)
      }
       let response = await this.wompi.generarLink(valor, this.user, description);
       response.subscribe((async (res: any) => {
         await this.firebase.registrarFactura(res.data.id, this.user,this.uid, "devops day", numberOfPeople, valor, [may23, may24], this.personForm.value.codigo)
         window.location.href = `https://checkout.wompi.co/l/${res.data.id}`
       }))
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: 'Debes diligenciar todos los campos',

      })
    }
  }
  returnKeys() {
    return Object.keys(this.precios)
  }




}
