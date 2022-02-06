import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MyAccountComponent } from './my-account/my-account.component';
import { OrdersComponent } from './orders/orders.component';
import { ProductsComponent } from './products/products.component';
import { SellerComponent } from './seller.component';

const routes: Routes = [
  {
    path: '',
    component: SellerComponent,
    children: [
      {
        path: 'orders',
        component: OrdersComponent,
      },
      {
        path: 'my-account',
        component: MyAccountComponent,
      },
      {
        path: 'products',
        component: ProductsComponent
      }
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class SellerRoutingModule {}
