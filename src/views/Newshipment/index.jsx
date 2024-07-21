import { PlusOutlined, UploadOutlined } from '@ant-design/icons';
import {
  Button,
  Col,
  DatePicker,
  Divider,
  Form,
  Input,
  InputNumber,
  message,
  Popconfirm,
  Row,
  Select,
  Space,
  Steps,
  Table,
} from 'antd';
import { history } from 'libs/util';
import React, { Component } from 'react';
import customerService from 'services/Customer';
import shipmentService from 'services/Shipment';
import FileUpload from 'views/Components/FileUpload';
import { hideLoading, showLoading } from 'views/Components/Loading';
import styles from './index.module.less';

const { Step } = Steps;
let idCounter = 0;
let totalPCs = 0;
let totalCartons = 0;
let subTotal = 0;
function generateUniqueId() {
  return idCounter++;
}

class NewShipment extends Component {
  state = {
    step: 1,
    formData: {},
    tableData: [],
    config: {
      customerCodeOptions: [],
      customerDueDateMap: {},
      millisecondsInADay: 24 * 60 * 60 * 1000,
      colors: [],
      styleCodes: [],
      styleNames: [],
      customerPos: {},
      csc: {},
      price: 0,
      invoice: {
        totalPCs: totalPCs,
        totalCartons: totalCartons,
        subTotal: subTotal,
      },
    },
    region: {
      form1: {},
      common: {},
      packingList: [],
    },
  };

  formRef = React.createRef();
  form1Ref = React.createRef();

  componentDidMount() {
    customerService
      .searchAll()
      .then((res) => {
        const options = res.data.customers.map((customer) => ({
          value: customer.customerCode,
          label: customer.customerCode,
        }));

        const projectionMap = {};
        const colors = [];
        const styleCodes = [];
        const styleNames = [];
        const customerPos = [];
        res.data.projections.forEach((pro) => {
          const key = `${pro.color}|${pro.styleCode}|${pro.customerPo}`;
          projectionMap[key] = pro;
          colors.push(pro.color);
          styleCodes.push(pro.styleCode);
          styleNames.push(pro.styleName);
          customerPos.push(pro.customerPo);
        });

        const customerDueDateMap = res.data.customers.reduce(
          (map, customer) => {
            map[customer.customerCode] = customer;
            return map;
          },
          {}
        );

        this.setState({
          config: {
            ...this.state.config,
            customerCodeOptions: options,
            customerDueDateMap: customerDueDateMap,
            colors: colors,
            styleCodes: styleCodes,
            styleNames: styleNames,
            customerPos: customerPos,
            csc: projectionMap,
          },
        });
      })
      .catch((error) => {
        console.error(error);
      });
  }

  handleStepChange = (currentStep) => {
    this.setState({ step: currentStep });
  };

  handleFormSubmit = (values) => {
    const customerDueDate =
      this.state.config.customerDueDateMap[values.customerCode];
    console.log(customerDueDate);
    values.billingContact = customerDueDate.billingContact;
    values.shipTo = customerDueDate.shipTo;
    values.term = customerDueDate.paymentTerm;
    this.setState({
      formData: values,
    });

    const { region, step } = this.state;
    values.invoiceId = region.common.invoiceId;
    values.shipmentId = region.common.shipmentId;

    shipmentService
      .saveShipmentAndIVoice(values)
      .then((res) => {
        if (res.code != 200) {
          message.error(`${res.msg}`);
          return;
        }

        this.setState({
          region: {
            ...this.state.region,
            common: {
              shipmentId: res.data.shipmentId,
              invoiceId: res.data.invoiceId,
            },
          },
          step: step + 1,
        });
      })
      .catch((error) => {
        console.error(error);
      });
  };

  handleAddRow = () => {
    this.setState((prevState) => ({
      tableData: [
        ...prevState.tableData,
        {
          id: generateUniqueId(),
          customerPo: '',
          styleCode: '',
          color: '',
          salePrice: 0,
          cartonCnt: 0,
          totalQuantity: 0,
        },
      ],
    }));
  };

  handleTableChange = (pagination, filters, sorter) => {
    console.log('Handling table change', pagination, filters, sorter);
  };

  handleDeleteRow = (id) => {
    this.setState((prevState) => ({
      tableData: prevState.tableData.filter((row) => row.id !== id),
    }));
  };

  // handleCreateInvoice = () => {
  //   showLoading();
  //   const { tableData, formData } = this.state;
  //   const saveShipmentData = {
  //     shipment: formData,
  //     packings: tableData,
  //     invoice: {
  //       totalPCs: totalPCs,
  //       totalCartons: totalCartons,
  //       subTotal: subTotal,
  //     },
  //   };
  //   shipmentService
  //     .createInvoice(saveShipmentData)
  //     .then(() => {
  //       message.success('Invoice created successfully!');
  //       // history.push('/shipment');
  //       hideLoading();
  //     })
  //     .catch((error) => {
  //       hideLoading();
  //       console.error(error);
  //     });
  // };

  handleCreateInvoice = () => {
    showLoading();
    const { tableData, formData } = this.state;
    const saveShipmentData = {
      shipment: formData,
      packings: tableData,
      invoice: {
        totalPCs: totalPCs,
        totalCartons: totalCartons,
        subTotal: subTotal,
      },
    };
    shipmentService
      .createInvoice(saveShipmentData, { responseType: 'blob' })
      .then((response) => {
        const blob = new Blob([response], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);

        const newWindow = window.open(url);
        if (newWindow) {
          newWindow.focus();
        } else {
          message.error('Please allow popups for this website');
        }

        message.success('Invoice created successfully!');
        hideLoading();
      })
      .catch((error) => {
        hideLoading();
        console.error(error);
      });
  };

  handleUploadChange = (info) => {
    if (info.file.status === 'done') {
      const response = info.file.response;

      if (response.code === 200) {
        this.setState(() => ({
          tableData: response.data.res,
        }));
      } else {
        message.error(`Error: ${response.msg}`);
      }
    } else if (info.file.status === 'error') {
      message.error(`${info.file.name} file upload failed.`);
    }
  };

  calculateProjectInfo = (po, style, color) => {
    const key = `${color}|${style}|${po}`;
    const value = this.state.config.csc[key];
    let salePrice = 0;
    let styleName = '';
    let fabrication = '';
    let size = '';
    if (value) {
      salePrice = value.salePrice;
      styleName = value.styleName;
      fabrication = value.fabrication;
      size = value.size;
      console.log(salePrice);
    } else {
      console.log('Key not found in csc', key);
    }
    return {
      salePrice: salePrice,
      styleName: styleName,
      fabrication: fabrication,
      size: size,
    };
  };

  handleInputChange = (record, fieldName, value) => {
    const updatedTableData = this.state.tableData.map((item) => {
      if (item.id === record.id) {
        const newData = { ...item, [fieldName]: value };

        if (
          fieldName === 'customerPo' ||
          fieldName === 'styleCode' ||
          fieldName === 'color'
        ) {
          const project = this.calculateProjectInfo(
            newData.customerPo,
            newData.styleCode,
            newData.color
          );
          newData.salePrice = project.salePrice;
          newData.styleName = project.styleName;
          newData.fabrication = project.fabrication;
          newData.size = project.size;
        }
        return newData;
      }
      return item;
    });
    this.setState({ tableData: updatedTableData });
  };

  handleInputChange2 = (record, field, value) => {
    const newData = [...this.state.tableData];
    const index = newData.findIndex((item) => item.id === record.id);
    if (index > -1) {
      const item = newData[index];
      newData.splice(index, 1, { ...item, [field]: value });
      this.setState({ tableData: newData });
    }
  };

  handleEtdDtDateChange = (date, dateString) => {
    console.log('Selected date: ', date);
    console.log('Formatted date: ', dateString);

    let { formData } = this.state;
    let invoiceDt = formData.invoiceDt;

    if (formData.customerCode && date) {
      const gap =
        this.state.config.customerDueDateMap[formData.customerCode].dueDateGap;
      invoiceDt = date.add(gap, 'days');
    }
    this.setState(
      {
        formData: {
          ...formData,
          etdDt: date,
          invoiceDt,
        },
      },
      () => {
        this.form1Ref.current?.setFieldsValue({
          invoiceDt: this.state.formData.invoiceDt,
        });
      }
    );
  };

  handleCustomerCodeSelectChange = (value) => {
    const customerDueDate = this.state.config.customerDueDateMap[value];
    console.log('Selected Customer Code: ', customerDueDate);

    let { formData } = this.state;
    let invoiceDt = formData.invoiceDt;
    if (formData.etdDt) {
      invoiceDt = formData.etdDt.add(customerDueDate.dueDateGap, 'days');
    }

    this.setState(
      {
        formData: {
          ...formData,
          customerCode: value,
          invoiceDt,
        },
      },
      () => {
        this.form1Ref.current?.setFieldsValue({
          invoiceDt: this.state.formData.invoiceDt,
        });
        console.log(this.state.formData);
        console.log(customerDueDate);
      }
    );
  };

  render() {
    const { step, formData, tableData, config } = this.state;

    const steps = [
      {
        key: 1,
        title: 'Shipment & Invoice',
        content: () => {
          return (
            <Form
              ref={this.form1Ref}
              layout="horizontal"
              labelCol={{ span: 8 }}
              wrapperCol={{ span: 16 }}
              onFinish={this.handleFormSubmit}
              initialValues={formData}
            >
              <Divider orientation="left">Shipment</Divider>
              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item
                    label="Bill of Landing"
                    name="billOfLanding"
                    rules={[
                      {
                        required: true,
                        message: 'Bill of Landing is required',
                      },
                    ]}
                  >
                    <Input />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    label="Ship From"
                    name="shipFrom"
                    rules={[
                      {
                        required: true,
                        message: 'Ship From is required',
                      },
                    ]}
                  >
                    <Input />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    label="Manufacture"
                    name="manufacture"
                    rules={[
                      {
                        required: true,
                        message: 'Manufacture is required',
                      },
                    ]}
                  >
                    <Input />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item
                    label="Country of Origin"
                    name="countryOfOrigin"
                    rules={[
                      {
                        required: true,
                        message: 'Country of Origin is required',
                      },
                    ]}
                  >
                    <Input />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    label="Vessel/Flight"
                    name="vesselFlight"
                    rules={[
                      {
                        required: true,
                        message: 'Vessel/Flight is required',
                      },
                    ]}
                  >
                    <Input />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    label="UBC PI"
                    name="ubcPi"
                    rules={[
                      {
                        required: true,
                        message: 'UBC PI is required',
                      },
                    ]}
                  >
                    <Input />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item
                    label="ETD Dt"
                    name="etdDt"
                    rules={[
                      {
                        required: true,
                        message: 'ETD Dt is required',
                      },
                    ]}
                  >
                    <DatePicker onChange={this.handleEtdDtDateChange} />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    label="Customer Code"
                    name="customerCode"
                    rules={[
                      {
                        required: true,
                        message: 'Country of Origin is required',
                      },
                    ]}
                  >
                    <Select
                      placeholder="Please Select"
                      options={config.customerCodeOptions}
                      onChange={this.handleCustomerCodeSelectChange}
                    />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    label="Ship Method"
                    name="shipMethod"
                    rules={[
                      {
                        required: true,
                        message: 'Ship Method is required',
                      },
                    ]}
                  >
                    <Select placeholder="Please Select">
                      <Select.Option value="Air">Air</Select.Option>
                      <Select.Option value="Ocean">Ocean</Select.Option>
                      <Select.Option value="Truck">Truck</Select.Option>
                      <Select.Option value="Freight">Freight</Select.Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Divider orientation="left">Invoice</Divider>
              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item
                    label="Invoice Code"
                    name="invoiceCode"
                    rules={[
                      {
                        required: true,
                        message: 'Invoice Code is required',
                      },
                    ]}
                  >
                    <Input />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    label="Additional Cost"
                    name="additionalCost"
                    initialValue={0.0}
                    rules={[
                      {
                        required: true,
                        message: 'Additional Cost is required',
                      },
                    ]}
                  >
                    <InputNumber />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    label="Deposit Amt"
                    name="depositAmt"
                    initialValue={0.0}
                    rules={[
                      {
                        required: true,
                        message: 'Deposit Amt is required',
                      },
                    ]}
                  >
                    <InputNumber />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item
                    label="Invoice Dt"
                    name="invoiceDt"
                    rules={[
                      {
                        required: true,
                        message: 'Invoice Dt is required',
                      },
                    ]}
                  >
                    <DatePicker value={formData.invoiceDt} />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    label="Invoice Due"
                    name="invoiceDue"
                    rules={[
                      {
                        required: true,
                        message: 'Invoice Due is required',
                      },
                    ]}
                  >
                    <DatePicker />
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item
                wrapperCol={{ span: 24 }}
                style={{ display: 'flex', justifyContent: 'center' }}
              >
                <Button onClick={() => history.push('/shipment')}>
                  Cancel
                </Button>
                <Button
                  style={{ marginLeft: 8 }}
                  type="primary"
                  htmlType="submit"
                  className="login-form-button"
                >
                  Next
                </Button>
              </Form.Item>
            </Form>
          );
        },
      },
      {
        key: 2,
        title: 'Packing',
        content: () => {
          return (
            <div>
              <Divider orientation="left">Packing</Divider>
              <div>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={this.handleAddRow}
                >
                  Add
                </Button>
                <FileUpload
                  onChange={this.handleUploadChange}
                  uploadParams={{ usedFor: 'packing' }}
                >
                  <Button style={{ marginLeft: 8 }} icon={<UploadOutlined />}>
                    Upload
                  </Button>
                </FileUpload>
              </div>
              <Table
                dataSource={tableData}
                rowKey="id"
                pagination={false}
                onChange={this.handleTableChange}
                style={{ marginTop: 8, marginBottom: 8 }}
                columns={[
                  {
                    title: 'PO',
                    dataIndex: 'customerPo',
                    key: 'customerPo',
                    render: (text, record) => (
                      <Input
                        defaultValue={record.customerPo}
                        onChange={(e) =>
                          this.handleInputChange(
                            record,
                            'customerPo',
                            e.target.value
                          )
                        }
                      />
                    ),
                  },
                  {
                    title: 'Style',
                    dataIndex: 'styleCode',
                    key: 'styleCode',
                    render: (text, record) => (
                      <Input
                        defaultValue={record.styleCode}
                        onChange={(e) =>
                          this.handleInputChange(
                            record,
                            'styleCode',
                            e.target.value
                          )
                        }
                      />
                    ),
                  },
                  {
                    title: 'Color',
                    dataIndex: 'color',
                    key: 'color',
                    render: (text, record) => (
                      <Input
                        defaultValue={record.color}
                        onChange={(e) =>
                          this.handleInputChange(
                            record,
                            'color',
                            e.target.value
                          )
                        }
                      />
                    ),
                  },
                  {
                    title: 'Price',
                    dataIndex: 'salePrice',
                    key: 'salePrice',
                    render: (text, record) => (
                      <InputNumber
                        value={record.salePrice}
                        onChange={(value) =>
                          this.handleInputChange2(record, 'salePrice', value)
                        }
                      />
                    ),
                  },
                  {
                    title: 'CARTON',
                    dataIndex: 'cartonCnt',
                    key: 'cartonCnt',
                    render: (text, record) => (
                      <InputNumber
                        value={record.cartonCnt}
                        onChange={(value) =>
                          this.handleInputChange2(record, 'cartonCnt', value)
                        }
                      />
                    ),
                  },
                  {
                    title: 'QTY.(PC)',
                    dataIndex: 'totalQuantity',
                    key: 'totalQuantity',
                    render: (text, record) => (
                      <InputNumber
                        value={record.totalQuantity}
                        onChange={(value) =>
                          this.handleInputChange2(
                            record,
                            'totalQuantity',
                            value
                          )
                        }
                      />
                    ),
                  },
                  {
                    title: '操作',
                    key: 'action',
                    render: (text, record) => (
                      <Space size="middle">
                        <Button type="link">编辑</Button>
                        <Popconfirm
                          title="确定要删除选中数据吗？"
                          onConfirm={() => this.handleDeleteRow(record.id)}
                        >
                          <Button type="link" danger>
                            删除
                          </Button>
                        </Popconfirm>
                      </Space>
                    ),
                  },
                ]}
              />
              <Form.Item
                wrapperCol={{ span: 24 }}
                style={{ display: 'flex', justifyContent: 'center' }}
              >
                <Button onClick={() => history.push('/shipment')}>
                  Cancel
                </Button>
                <Button
                  style={{ marginLeft: 8 }}
                  onClick={() => this.handleStepChange(1)}
                >
                  Prev
                </Button>
                <Button
                  type="primary"
                  style={{ marginLeft: 8 }}
                  onClick={() => {
                    const customerPos = this.state.tableData
                      .map((item) => item.customerPo)
                      .join('/');

                    this.setState((prevState) => ({
                      formData: {
                        ...prevState.formData,
                        customerPos: customerPos,
                      },
                    }));
                    console.log(this.state.tableData);
                    this.handleStepChange(3);
                  }}
                >
                  Next
                </Button>
              </Form.Item>
            </div>
          );
        },
      },
      {
        key: 3,
        title: 'Review Shipment Summary & Invoice',
        content: () => {
          totalPCs = 0;
          totalCartons = 0;
          subTotal = 0;
          this.state.tableData.forEach((item) => {
            totalPCs += item.cartonCnt;
            totalCartons += item.totalQuantity;
            subTotal += item.salePrice * item.totalQuantity;
          });

          console.log('render step 3', this.state.tableData);
          return (
            <div>
              <Divider orientation="left">
                Review Shipment Summary & Invoice
              </Divider>
              <div style={{ padding: '60px' }}>
                <Row gutter={16}>
                  <Col span={8}>
                    <p>Bill of Landing: {formData.billOfLanding}</p>
                  </Col>
                  <Col span={8}>
                    <p>Customer Code: {formData.customerCode}</p>
                  </Col>
                  <Col span={8}>
                    <p>PO: {formData.customerPos}</p>
                  </Col>
                </Row>
                <Row gutter={16}>
                  <Col span={8}>
                    <p>Total PCs: {totalPCs}</p>
                  </Col>
                  <Col span={8}>
                    <p>Total Cartons: {totalCartons}</p>
                  </Col>
                  <Col span={8}>
                    <p>Sub-Total: {subTotal}</p>
                  </Col>
                </Row>
              </div>
              <Form.Item
                wrapperCol={{ span: 24 }}
                style={{ display: 'flex', justifyContent: 'center' }}
              >
                <Button onClick={() => history.push('/shipment')}>
                  Cancel
                </Button>
                <Button
                  style={{ marginLeft: 8 }}
                  onClick={() => this.handleStepChange(2)}
                >
                  Prev
                </Button>
                <Button
                  type="primary"
                  style={{ marginLeft: 8 }}
                  onClick={this.handleCreateInvoice}
                >
                  Create Invoice
                </Button>
              </Form.Item>
            </div>
          );
        },
      },
    ];

    return (
      <div style={{ background: '#ffffff', padding: 20, borderRadius: 10 }}>
        <Steps current={step - 1} className={styles['steps']}>
          {steps.map((item) => (
            <Step
              key={item.key}
              title={`${item.title}`}
              onClick={() => this.handleStepChange(item.key)}
              style={{ cursor: step === item.key ? 'default' : 'pointer' }}
            />
          ))}
        </Steps>
        <div>{steps[step - 1].content()}</div>
      </div>
    );
  }
}

export default NewShipment;
