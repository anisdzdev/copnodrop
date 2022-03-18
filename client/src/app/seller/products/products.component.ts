import { Component, OnDestroy, OnInit } from '@angular/core';
import { Product } from 'libs/products/model/products';
import { MenuItem } from 'primeng/api';
import { ConfirmationService } from 'primeng/api';
import { MessageService } from 'primeng/api';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SellerService } from '../seller.service';
import { AuthService, User } from 'src/app/auth/auth.service';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-products',
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.scss'],
})
export class ProductsComponent implements OnInit, OnDestroy {
  productDialog: boolean;
  products: Product[] = [];
  product: Product;
  selectedProducts: Product[];
  submitted: boolean;
  productForm: FormGroup;
  editmode: boolean = false;
  firstImage: string;
  secondImage: string;
  isLoggedIn: boolean;
  user: User;
  subscription: Subscription[] = [];
  imageDisplay: string | ArrayBuffer;
  images = [];


  constructor(
    private router: Router,
    private authService: AuthService,
    private sellerService: SellerService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private formBuilder: FormBuilder
  ) {}

  ngOnDestroy(): void {
    this.subscription.map((sub) => sub.unsubscribe());
  }

  ngOnInit(): void {
    

    this.authService.getUserFromStorage();
    const sub = this.authService.isloginSubject.subscribe(
      (value) => (this.isLoggedIn = value)
    );
    this.subscription.push(sub);

    if (this.isLoggedIn) {
      this.user = this.authService.getUserFromStorage();
    } else {
      this.router.navigateByUrl('');
    }
    
    this._getProducts();

    this.productForm = this.formBuilder.group({
      name: ['', Validators.required],
      price: ['', Validators.required],
      category: ['', Validators.required],
      // quantity: ['', Validators.required],
      description: ['', Validators.required],
      images: ['', Validators.required],
      creator: ['', Validators.required],
    });
  }

  openNew() {
    this.product = {
      name: '',
      description: '',
      category: '',
      price: {$numberDecimal: 0},
      sale: 0,
      images: [],
      quantity: 0
      
    };
    this.submitted = false;
    this.productDialog = true;
  }

  deleteSelectedProducts() {
    this.confirmationService.confirm({
      message: 'Are you sure you want to delete the selected products?',
      header: 'Confirm',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {

        this.selectedProducts.forEach(element => {
            this.sellerService.deleteProduct(element._id, this.user.token)
            .subscribe(
              () => {
                this._getProducts();
              },
              () => {
                this.messageService.add({
                  severity: 'error',
                  summary: 'Error',
                  detail: 'Product is not deleted!',
                });
              }
            );
          
        });

        // this.products = this.products.filter(
        //   (val) => !this.selectedProducts.includes(val)
        // );
        this.selectedProducts = null;
        this.messageService.add({
          severity: 'success',
          summary: 'Successful',
          detail: 'Products Deleted',
          life: 3000,
        });
      },
    });
  }

  editProduct(product: Product) {
    this.editmode = true;
    this.product = { ...product };
    console.log(this.product);
    this.productDialog = true;
  }

  private _getProducts() {
    this.sellerService.getProducts().subscribe((products) => {
      this.products = products.filter( (data) => data.creator.id == this.user._id);
    });
  }

  deleteProduct(product: Product) {
    this.confirmationService.confirm({
      message: 'Are you sure you want to delete ' + product.name + '?',
      header: 'Confirm',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.sellerService
          .deleteProduct(product._id, this.user.token)
          .subscribe(
            () => {
              this._getProducts();
              this.messageService.add({
                severity: 'success',
                summary: 'Success',
                detail: 'Product is deleted!',
              });
            },
            () => {
              this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: 'Product is not deleted!',
              });
            }
          );
      },
    });
  }

  hideDialog() {
    this.productDialog = false;
    this.submitted = false;
  }

  saveProduct() {
    this.product.images = [];

    this.submitted = true;
    this.product.images.push(this.firstImage);

    if (this.secondImage) this.product.images.push(this.secondImage);

    if (this.product.name.trim()) {
      if (this.editmode == true) {
        // this.products[this.findIndexById(this.product.id)] = this.product;
        this.fillProductForm();
        this._updateProduct(this.productForm.value);
      } else {

        this.fillProductForm();
        this.products.push(this.product);
        // console.log(this.productForm.get('images').value);
        console.log(this.productForm.value);
        this.sellerService
          .createProduct(this.productForm.value, this.user.token)
          .subscribe(
            (res) => {
              this.messageService.add({
                severity: 'success',
                summary: 'Successful',
                detail: 'Product Created',
                life: 3000,
              });
            },
            (err) => {
              this.messageService.add({
                severity: 'error',
                summary: 'Error!',
                detail:
                  'An error has occured while adding the product. Try again later',
                life: 3000,
              });
            }
          );
      }

      this.products = [...this.products];
      this.productDialog = false;
      this.product = {};
    }
  }

  findIndexById(id: string): number {
    let index = -1;
    for (let i = 0; i < this.products.length; i++) {
      if (this.products[i]._id === id) {
        index = i;
        break;
      }
    }

    return index;
  }

  createId(): string {
    let id = '';
    var chars =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (var i = 0; i < 5; i++) {
      id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return id;
  }

  getEventValue($event: any): string {
    return $event.target.value;
  }

  fillProductForm() {
    this.productForm.get('name').setValue(this.product.name);
    this.productForm.get('price').setValue(this.product.price.$numberDecimal);
    this.productForm.get('category').setValue(this.product.category);
    this.productForm.get('description').setValue(this.product.description);
    this.productForm.get('creator').setValue(this.product.creator);
  
  }

  private _updateProduct(productFormData: FormData) {
    this.sellerService
      .updateProduct(productFormData, this.product._id, this.user.token)
      .subscribe(
        (product: Product) => {
          this._getProducts();
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: `Product ${product.name} is updated!`,
          });
        },
        () => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Product is not updated!',
          });
        }
      );
      this.editmode = false;
  }

  // onImageUpload(event) {
  //   const file = event.target.files[0];
  //   const reader = new FileReader();
  //   reader.readAsDataURL(file);
  //   reader.onload = () => {
  //       this.productForm.controls['images'].setValue(reader.result);
  //     };
  // }


onImageUpload(event){
  const file = event.dataTransfer ? event.dataTransfer.files[0] : event.target.files[0];
    const reader = new FileReader();

    const fileDto: Partial<any> = {
        // your other data here
        title: 'what ever here',
        fileAsBase64: null
    };

    reader.onload = (ev: ProgressEvent) => {
        this.productForm.controls['images'].setValue(reader.result);
    };
    
    
}





  // myFiles:string [] = [];
  // onImageUpload(event) {
  //     for (var i = 0; i < event.target.files.length; i++) { 
  //         this.myFiles.push(event.target.files[i]);
          
  //       }
  //     this.productForm.get('images').setValue(this.myFiles);
  //   }    

  // onImageUpload(event) {
  //   const file = event.target.files[0];
  //   this.productForm.get('images').setValue(file);
    
  // }   




}
