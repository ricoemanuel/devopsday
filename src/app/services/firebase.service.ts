import { Injectable, inject } from '@angular/core';
import { Auth, signInWithEmailAndPassword, signOut, authState, createUserWithEmailAndPassword } from '@angular/fire/auth';
import { DocumentData, DocumentReference, Firestore, addDoc, collection, collectionData, deleteDoc, doc, getDoc, getDocs, onSnapshot, query, setDoc, where } from '@angular/fire/firestore';
import { EMPTY, Observable, catchError, distinctUntilChanged, from, interval, map, switchMap } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Database, Query, object, objectVal, ref, remove } from '@angular/fire/database'
import { traceUntilFirst } from '@angular/fire/performance';
import { environment } from 'src/environments/environment';
@Injectable({
  providedIn: 'root'
})
export class FirebaseService {
  private apiUrl = 'https://pagos-devopsday-default-rtdb.firebaseio.com/transacciones.json';

  esAdminS!: boolean
  constructor(private database: Database, private auth: Auth, private firestore: Firestore, private http: HttpClient, private db: Database) { }
  login(objeto: any) {
    let email = objeto.email
    let password = objeto.password
    return signInWithEmailAndPassword(this.auth, email, password)
  }
  actualizarFactura(obj: any,id:string) {
    const entradaRef = doc(this.firestore, "facturas", id)
    return setDoc(entradaRef, obj)
  }
  async getFactura(id: string) {
    const entradaRef = collection(this.firestore, 'facturas');
    const q = query(entradaRef, where('link', '==', id));
  
    try {
      const querySnapshot = await getDocs(q);
      return querySnapshot;
    } catch (error) {
      console.error('Error al obtener los asientos:', error);
      throw error;
    }
  }
  getDatosWompi(): Observable<any> {
    return interval(100).pipe(
      switchMap(() => this.http.get<any>(this.apiUrl)),
      distinctUntilChanged() // Emite solo si los datos son diferentes a los previos
    );
  }

  singup(objeto: any) {
    let email = objeto.email
    let password = objeto.password
    return createUserWithEmailAndPassword(this.auth, email, password)
  }
  userObserver(id: string) {
    const userRef = doc(this.firestore, "usuarios", id);
    return getDoc(userRef);
  }
  cerrarSesion() {
    return signOut(this.auth)
  }
  getAuthState() {
    return authState(this.auth)
  }

  async getevento(id: string) {
    const eventoRef = doc(this.firestore, "eventos", id);
    const eventoSnapshot = await getDoc(eventoRef);

    if (eventoSnapshot.exists()) {
      const eventoData = eventoSnapshot.data();
      return eventoData;
    } else {
      return null;
    }
  }
  getAsientoRealtime(fila: number, columna: number, evento: string, zona: string): Observable<DocumentData[]> {
    const entradaRef = collection(this.firestore, 'asientos');
    const q = query(entradaRef, where('nombreZona', '==', zona), where('fila', '==', fila), where('columna', '==', columna), where('evento', '==', evento));

    return new Observable<DocumentData[]>(observer => {
      const unsubscribe = onSnapshot(q, snapshot => {
        const asientos: DocumentData[] = [];
        snapshot.forEach(doc => {
          asientos.push(doc.data());
        });
        observer.next(asientos);
      });

      // Unsubscribe function
      return () => {
        unsubscribe();
      };
    });
  }
  getAsientoRealtimeByEvento(evento: string): Observable<DocumentData[]> {
    const entradaRef = collection(this.firestore, 'asientos');
    const q = query(entradaRef, where('evento', '==', evento));
    return new Observable<DocumentData[]>(observer => {
      const unsubscribe = onSnapshot(q, snapshot => {
        const asientos: DocumentData[] = [];
        snapshot.forEach(doc => {
          asientos.push(doc.data());
        });
        observer.next(asientos);
      });
      return () => {
        unsubscribe();
      };
    });
  }
  getAsientoRealtimeByUsuarioEstado(user: string, evento: string): Observable<DocumentData[]> {
    const entradaRef = collection(this.firestore, 'asientos');
    const q = query(entradaRef, where('clienteUser', '==', user), where('clienteEstado', '==', 'sin pagar'), where('evento', '==', evento));
    return new Observable<DocumentData[]>(observer => {
      const unsubscribe = onSnapshot(q, snapshot => {
        const asientos: DocumentData[] = [];
        snapshot.forEach(doc => {
          asientos.push(doc.data());
        });
        observer.next(asientos);
      });
      return () => {
        unsubscribe();
      };
    });
  }
  async getAsientoByUsuarioEstado(user: string, evento: string): Promise<DocumentData[]> {
    const entradaRef = collection(this.firestore, 'asientos');
    const q = query(entradaRef, where('clienteUser', '==', user), where('clienteEstado', '==', 'sin pagar'), where('evento', '==', evento));

    try {
      const snapshot = await getDocs(q);
      const asientos: DocumentData[] = [];
      snapshot.forEach(doc => {
        asientos.push(doc.data());
      });
      return asientos;
    } catch (error) {
      console.error("Error al obtener los asientos:", error);
      throw error; // Puedes manejar el error según tus necesidades
    }
  }
  async getAsientoByEvento(evento: string): Promise<DocumentData[]> {
    const entradaRef = collection(this.firestore, 'asientos');
    const q = query(entradaRef, where('evento', '==', evento));

    try {
      const snapshot = await getDocs(q);
      const asientos: DocumentData[] = [];
      snapshot.forEach(doc => {
        asientos.push(doc.data());
      });
      return asientos;
    } catch (error) {
      console.error("Error al obtener los asientos:", error);
      throw error; // Puedes manejar el error según tus necesidades
    }
  }
  async getAsientoByLibre(): Promise<DocumentData[]> {
    const entradaRef = collection(this.firestore, 'asientos');
    const q = query(entradaRef, where('evento', '==', '0pRlSIWu9Cxyv7X8s8TQ'));
    try {
      const snapshot = await getDocs(q);
      const asientos: DocumentData[] = [];
      snapshot.forEach(doc => {
        asientos.push(doc.data());
      });
      return asientos;
    } catch (error) {
      console.error("Error al obtener los asientos:", error);
      throw error; // Puedes manejar el error según tus necesidades
    }
  }


  actualizarAsiento(asiento: any) {
    const entradaRef = doc(this.firestore, "asientos", `f${asiento.fila}c${asiento.columna}-${asiento.evento}`)
    return setDoc(entradaRef, asiento)
  }
  getAsiento(asiento: any) {
    const entradaRef = doc(this.firestore, "asientos", `f${asiento.fila}c${asiento.columna}-${asiento.evento}`)
    return getDoc(entradaRef)
  }
  getAsientoByDoc(asiento: string) {
    const entradaRef = doc(this.firestore, "asientos", asiento)
    return getDoc(entradaRef)
  }
  async getUser(uid: string) {
    const usuarioRef = doc(this.firestore, "usuarios", uid);
    const usuarioSnapshot = await getDoc(usuarioRef);

    if (usuarioSnapshot.exists()) {
      const usuarioData = usuarioSnapshot.data();
      return usuarioData;
    } else {
      return null;
    }
  }
  async setUser(obj: any, uid: string) {
    const usuarioRef = doc(this.firestore, "usuarios", uid)
    return setDoc(usuarioRef, obj)
  }
  getAsientosByEventoAndZona(eventoId: string, zona: string) {
    const entradaRef = collection(this.firestore, 'asientos');
    const q = query(entradaRef, where('nombreZona', '==', zona), where('evento', '==', eventoId));
    return new Observable<DocumentData[]>(observer => {
      const unsubscribe = onSnapshot(q, snapshot => {
        const asientos: DocumentData[] = [];
        snapshot.forEach(doc => {
          asientos.push(doc.data());
        });
        observer.next(asientos);
      });
      return () => {
        unsubscribe();
      };
    });
  }
  getAsientosByEvento(eventoId: string) {
    const entradaRef = collection(this.firestore, 'asientos');
    const q = query(entradaRef, where('evento', '==', eventoId));
    return new Observable<DocumentData[]>(observer => {
      const unsubscribe = onSnapshot(q, snapshot => {
        const asientos: DocumentData[] = [];
        snapshot.forEach(doc => {
          asientos.push(doc.data());
        });
        observer.next(asientos);
      });
      return () => {
        unsubscribe();
      };
    });
  }
  transactions(): Observable<any> {
    const doc = ref(this.database, 'transacciones');
    let transactions$: Observable<any> = objectVal(doc).pipe(
      traceUntilFirst('database')
    );
    return transactions$
  }

  async registrarFactura(link:string,uid: string,idUser:string,eventoData:any, people:number, value:number, fechas:boolean[], codigo:string, asistentes:any[]) {
    let obj: any = {
      estado:'pagando',
      link,
      uid,
      idUser,
      fecha:new Date(),
      eventoData,
      people,
      value,
      fechas,
      codigo,
      asistentes
    }
    const facturaRef = collection(this.firestore, "facturas")
    let doc: DocumentReference = await addDoc(facturaRef, obj)
    return doc
      // fetch(environment.EmailSender.link, {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'x-api-key':environment.EmailSender.head
      //   },
      //   body: JSON.stringify({
      //     correo: user.correo,
      //     nombre: user.nombre,
      //     factura: doc.id,
      //   }),
      // }).catch(error=>{
      //   console.log(error)
      // })
  }

  async valirdarAsientos(id: string, user: string) {
    this.getAsientoByUsuarioEstado(user, id).then(res => {
      res.forEach(async (asiento: any) => {
        asiento.clienteEstado = "null"
        asiento.clienteUser = "null"
        asiento.estado = "libre"
        await this.actualizarAsiento(asiento)
      })
    })

  }
  getCurrentFacturas(uid: string): Observable<DocumentData[]> {
    const entradaRef = collection(this.firestore, 'facturas');
    const q = query(entradaRef, where('idUser', '==', uid));
  
    return new Observable<DocumentData[]>(observer => {
      const unsubscribe = onSnapshot(q, snapshot => {
        const asientos: DocumentData[] = [];
  
        snapshot.forEach(doc => {
          const dataWithId = { ...doc.data(), id: doc.id };
          asientos.push(dataWithId);
        });
  
        observer.next(asientos);
      });
  
      return () => {
        unsubscribe();
      };
    });
  }
  async setUserDescuento(obj: any) {
    const usuarioRef = doc(this.firestore, "usuariosRigoDesc", obj.Documento.toString())
    return setDoc(usuarioRef, obj)
  }
  getFacturas(): Observable<DocumentData[]> {
    const facturasRef = collection(this.firestore, 'facturas');
  
    return new Observable<DocumentData[]>(observer => {
      const unsubscribe = onSnapshot(facturasRef, snapshot => {
        const facturas: DocumentData[] = [];
  
        snapshot.forEach(doc => {
          const dataWithId = { ...doc.data(), id: doc.id };
          facturas.push(dataWithId);
        });
  
        observer.next(facturas);
      });
  
      return () => {
        unsubscribe();
      };
    });
  }
  getFacturasBycodigo(): Observable<DocumentData[]> {
    const entradaRef = collection(this.firestore, 'facturas');
    const q = query(entradaRef,where('codigo','!=','""'),where('estado','==','comprado'));
  
    return new Observable<DocumentData[]>(observer => {
      const unsubscribe = onSnapshot(q, snapshot => {
        const asientos: DocumentData[] = [];
  
        snapshot.forEach(doc => {
          const dataWithId = { ...doc.data(), id: doc.id };
          asientos.push(dataWithId);
        });
  
        observer.next(asientos);
      });
  
      return () => {
        unsubscribe();
      };
    });
  }

}


