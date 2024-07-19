import Http from 'libs/http';

class CustomerService {
  //查询
  searchAll(params) {
    return Http.get(`/customer/searchAllCustomerAndProjection`, params);
  }
}

const customerService = new CustomerService();
export default customerService;
