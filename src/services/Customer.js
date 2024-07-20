import Http from 'libs/http';

class CustomerService {
  //查询
  search(params) {
    return Http.post(`/customer/search`, params);
  }

  saveOrUpdate(params) {
    return Http.post(`customer/saveOrUpdate`, params);
  }

  remove(params) {
    return Http.delete(`customer/remove`, params);
  }

  //查询
  searchAll(params) {
    return Http.get(`/customer/searchAllCustomerAndProjection`, params);
  }
}

const customerService = new CustomerService();
export default customerService;
