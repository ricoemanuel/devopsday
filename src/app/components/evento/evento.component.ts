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
      "combo": 449000,
      "estado": 'activo'
    },
  }
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
      may24: [false]
    });
  }

  current: any
  user: any
  async ngOnInit(): Promise<void> {
    this.current = this.currentPrice()
    this.firebase.getAuthState().subscribe(async res => {
      if (res) {
        this.user = res.uid
      }
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
      this.formTab = true
    } else {
      this.router.navigate(['login'])
    }

  }
  disabled:boolean=false
  async pagar() {
    if (this.personForm.valid) {
      this.disabled=true
      let numberOfPeople = this.personForm.value.numberOfPeople
      let may23 = this.personForm.value.may23
      let may24 = this.personForm.value.may24
      let price = this.precios[this.current].persona
      let description = `Pago de ${numberOfPeople} personas ${may23 && may24 ? 'para las fechas 24 y 23 de mayo' : may23 ? 'para la fecha 23 de mayo' : may24 ? 'para la fecha 24 de mayo' : null}`
      console.log(description)
      if (numberOfPeople >= 5 && may23 && may24) {
        price = this.precios[this.current].combo
      }

      let valor = numberOfPeople * price
      let response = await this.wompi.generarLink(valor, this.user, "devops day", description);
      response.subscribe((async (res: any) => {
        await this.firebase.registrarFactura(res.data.id, this.user, "devops day", numberOfPeople, valor, [may23,may24])
        window.location.href = `https://checkout.wompi.co/l/${res.data.id}`
      }))
    }
  }
  returnKeys() {
    console.log(this.current)
    return Object.keys(this.precios)
  }




}
