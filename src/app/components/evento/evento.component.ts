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
  codigos: any[] = []
  firstFormGroup = this.formBuilder.group({
    firstCtrl: ['', Validators.required],
  });
  constructor(private aRoute: ActivatedRoute,
    private firebase: FirebaseService,
    private modalService: BsModalService,
    private wompi: WompiService,
    protected _sanitizer: DomSanitizer,
    private cdRef: ChangeDetectorRef,
    private el: ElementRef, private router: Router,
    private formBuilder: FormBuilder,
    private route: ActivatedRoute,) {
    this.personForm = this.formBuilder.group({
      numberOfPeople: ['', [Validators.required, Validators.min(1)]],
      may23: [false],
      may24: [false],
      codigo: ['']
    });
    
  }

  current: any
  user: any
  uid!: string
  users: any[] = []
  activeTab: number = 0
  selectTab(number: number) {
    this.activeTab = number
  }
  cambiar(factor: number) {
    console.log(this.activeTab)
    if (factor === -1 && this.activeTab === 0) {
      return
    } else if (factor > 0) {
      this.activeTab += 1
    } else {
      this.activeTab -= 1
    }
   const formularioElement = document.getElementById('formulario');
   if (formularioElement) {
       formularioElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
   }

  }
  valid: boolean = false

  onStepChange(event: any) {
    // Verificar si el paso seleccionado es el paso de pagar
    if (event.selectedIndex === 2) { // Ajusta el índice según la posición del paso de pagar
        this.calcularValor();
    }
}
  validate() {
    this.users.forEach(user => {
      if (user.email == "" || user.nombre == "" || user.numero == "" || user.tipoCedula == "" || user.telefono == "" || user.ciudad == "" || user.talla == "") {
        user.valid = false
      } else {
        user.valid = true
      }
      if (!user.email.includes("@")) {
        user.valid = false
      }
    })

  }
  array() {
    this.users = []
    let numberOfPeople = this.personForm.value.numberOfPeople
    for (let i = 0; i < numberOfPeople; i++) {
      this.users.push({
        email: "",
        nombre: "",
        numero: "",
        tipoCedula: "",
        empresa: "",
        telefono: "",
        cargo: "",
        ciudad: "",
        talla: "",
        consentimiento: false,
        valid: false
      })
    }
    this.users[0] = {
      email: this.user.email,
      nombre: this.user.nombre,
      numero: this.user.numero,
      tipoCedula: this.user.tipoCedula,
      empresa: this.user.empresa,
      telefono: this.user.telefono,
      cargo: this.user.cargo,
      ciudad: this.user.ciudad,
      talla: this.user.talla,
      consentimiento: this.user.consentimiento,
      valid: true
    }
  }
  async ngOnInit(): Promise<void> {
    this.route.queryParams.subscribe(async params => {
      if (params["comprar"] === "true") {
        this.formTab = true
      }
    })
    this.current = this.currentPrice()
    this.firebase.getAuthState().subscribe(async res => {
      if (res) {
        let userData = await this.firebase.getUser(res.uid)
        this.uid = res.uid
        this.user = userData
      }
    })
    this.firebase.getFacturasBycodigo().subscribe((res: any) => {
      this.codigos = res
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
      const queryParams = {
        redirect: true,
      };
      this.router.navigate(['login'],{queryParams})
    }

  }
  disabled: boolean = false
  valorFinal:any[]=[]
  calcularValor() {
    let numberOfPeople = this.personForm.value.numberOfPeople
    let may23 = this.personForm.value.may23
    let may24 = this.personForm.value.may24
    let price = this.precios[this.current].persona
    const valorIndividual=this.precios[this.current].persona
    let valorEnComboIndividual;
    if (numberOfPeople >= 5 && may23 && may24) {
      price = this.precios[this.current].combo
      valorEnComboIndividual=this.precios[this.current].combo
    }
    
    let valor = numberOfPeople * price * (may23 && may24 ? 2 : 1)
    const valorTotal=numberOfPeople * price * (may23 && may24 ? 2 : 1)
    let valorDescuentoCodigo;
    if (this.codigos.length <= 50) {
      valor = valor - (this.personForm.value.codigo === "CoDevospDays2024" ? valor * (20 / 100) : 0)
      valorDescuentoCodigo=valor - (this.personForm.value.codigo === "CoDevospDays2024" ? valor * (20 / 100) : 0)
    }
    
    this.valorFinal=[{
      valorIndividual:valorIndividual?valorIndividual:0,
      valorEnComboIndividual:valorEnComboIndividual?valorEnComboIndividual:0,
      valorTotal:valorTotal?valorTotal:0,
      valorDescuentoCodigo:valorDescuentoCodigo?valorDescuentoCodigo:0
    }]
    console.log(this.valorFinal)
  }
  async pagar() {
    this.validate()
    let valid=this.users.filter(user=>!user.valid)
    console.log(valid)
    if (valid.length===0&&this.personForm.valid && (this.personForm.value.may23 || this.personForm.value.may24)) {
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
      if (this.codigos.length <= 50) {
        valor = valor - (this.personForm.value.codigo === "CoDevospDays2024" ? valor * (20 / 100) : 0)
      }
      let response = await this.wompi.generarLink(valor, this.user, description);
      response.subscribe((async (res: any) => {
        await this.firebase.registrarFactura(res.data.id, this.user, this.uid, "devops day", numberOfPeople, valor, [may23, may24], this.personForm.value.codigo, this.users)
        window.location.href = `https://checkout.wompi.co/l/${res.data.id}`
      }))
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: 'Debes diligenciar todos los campos obligatorios y llenar toda la información de los usuarios',

      })
    }
  }
  returnKeys() {
    return Object.keys(this.precios)
  }




}
