import Http from 'libs/http';

class ShipmentService {
  //查询
  search(params) {
    return Http.post(`/shipment/search`, params);
  }

  //下载shipment
  downloadShipment(params) {
    return Http.post(
      `/shipment/download`,
      {
        ids: params.selection.map((item) => item.shipId),
      },
      { responseType: 'blob' }
    );
  }

  //保存Packing
  savePacking(params) {
    return Http.post(`packing/savePacking`, params);
  }

  //create invocei
  createInvoice(params) {
    return Http.post(`/shipment/createInvoice`, params);
  }

  //save shipment and ivoice
  saveShipmentAndIVoice(params) {
    return Http.post(`shipment/saveShipmentAndIVoice`, params);
  }

  saveOrUpdate(params) {
    return Http.post(`shipment/saveOrUpdate`, params);
  }

  remove(params) {
    return Http.delete(`shipment/remove`, params);
  }
}

const shipmentService = new ShipmentService();
export default shipmentService;
