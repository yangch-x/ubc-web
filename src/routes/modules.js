const routes = [
  {
    label: 'Shpiment',
    path: '/shipment',
    component: () => import('views/Shipment'),
  },
  {
    label: 'Projection',
    path: '/projection',
    component: () => import('views/Projection'),
  },
  {
    label: 'Customer',
    path: '/customer',
    component: () => import('views/Customer'),
  },
  {
    label: 'Invoice',
    path: '/Invoice',
    component: () => import('views/Invoice'),
  },
  {
    label: '新出运',
    hidden: true,
    path: '/newshpiment',
    component: () => import('views/Newshipment'),
  },
];
export default routes;
