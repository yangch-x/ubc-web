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
    hidden: true,
    path: '/Invoice',
    component: () => import('views/Invoice'),
  },
  {
    label: '新出运',
    hidden: true,
    path: '/newshipment',
    component: () => import('views/Newshipment'),
  },
  {
    label: 'PO',
    path: '/po',
    component: () => import('views/PO'),
  },
];
export default routes;
