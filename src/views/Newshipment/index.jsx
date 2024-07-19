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
// import { jsPDF } from "jspdf";
// import 'jspdf-autotable';
import { history } from 'libs/util';
import React, { Component } from 'react';
import customerService from 'services/Customer';
import shipmentService from 'services/Shipment';
import FileUpload from 'views/Components/FileUpload';
import { hideLoading, showLoading } from 'views/Components/Loading';
import styles from './index.module.less';

const { Step } = Steps;
let idCounter = 0;

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
    customerService.searchAll().then((res) => {
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

      const customerDueDateMap = res.data.customers.reduce((map, customer) => {
        map[customer.customerCode] = customer;
        return map;
      }, {});

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
    });
  }

  handleStepChange = (currentStep) => {
    this.setState({ step: currentStep });
  };

  handleFormSubmit = (values) => {
    this.setState({
      formData: values,
    });

    const { region, step } = this.state;
    values.invoiceId = region.common.invoiceId;
    values.shipmentId = region.common.shipmentId;

    shipmentService
      .saveShipmentAndIVoice(values)
      .then((res) => {
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
      .catch(() => {});
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

  handleCreateInvoice = () => {
    showLoading();
    // setTimeout(() => {
    //   hideLoading();
    //   this.generatePDF()
    // }, 3000);
    // return
    const { region, tableData } = this.state;
    const saveShipmentData = {
      Shipment: region.form1,
      Invoice: region.form1,
      Packings: tableData,
    };
    shipmentService
      .createInvoice(saveShipmentData)
      .then(() => {
        message.success('Invoice created successfully!');
        history.push('/shipment');
      })
      .catch(() => {
        message.error('Failed to create invoice.');
      });
  };

  handleEtdDtDateChange = (date, dateString) => {
    console.log('Selected date: ', date);
    console.log('Formatted date: ', dateString);

    let { formData } = this.state;
    let invoiceDt = formData.invoiceDt;

    if (formData.customerCode) {
      const gap = this.state.config.customerDueDateMap[formData.customerCode].dueDateGap;
      invoiceDt = date.add(gap, 'days');
    }
    this.setState({
      formData: {
        ...formData,
        etdDt: date,
        invoiceDt,
      },
    }, () => {
      this.form1Ref.current?.setFieldsValue({ invoiceDt: this.state.formData.invoiceDt });
    });
  };

  handleCustomerCodeSelectChange = (value) => {
    const customerDueDate = this.state.config.customerDueDateMap[value];
    console.log('Selected Customer Code: ', customerDueDate);

    let { formData } = this.state;
    let invoiceDt = formData.invoiceDt;

    if (formData.etdDt) {
      invoiceDt = formData.etdDt.add(customerDueDate.dueDateGap, 'days');
    }
    this.setState({
      formData: {
        ...formData,
        customerCode: value,
        invoiceDt,
      },
    }, () => {
      this.form1Ref.current?.setFieldsValue({ invoiceDt: this.state.formData.invoiceDt });
    });
  };

  handleUploadChange = (info) => {
    if (info.file.status === 'done') {
      const response = info.file.response;
      message.success(`${info.file.name} file uploaded successfully.`);
      console.log('File upload response:', response);
      this.setState(() => ({
        tableData: response.data.res,
      }));
    } else if (info.file.status === 'error') {
      message.error(`${info.file.name} file upload failed.`);
    } else {
      console.log('File upload in progress', info);
    }
  };

  calculateNewPrice = (po, style, color) => {
    const key = `${color}|${style}|${po}`;
    const value = this.state.config.csc[key];
    let salePrice = 0;
    if (value) {
      salePrice = value.salePrice;
      console.log(salePrice);
    } else {
      console.log('Key not found in csc', key);
    }
    return salePrice;
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
          newData.salePrice = this.calculateNewPrice(
            newData.customerPo,
            newData.styleCode,
            newData.color
          );
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
                  <Form.Item label="Ship From" name="shipFrom">
                    <Input />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item label="Manufacture" name="manufacture">
                    <Input />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item label="Country of Origin" name="countryOfOrigin">
                    <Input />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item label="Vessel/Flight" name="vesselFlight">
                    <Input />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item label="UBC PI" name="ubcPi">
                    <Input />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item label="ETD Dt" name="etdDt">
                    <DatePicker onChange={this.handleEtdDtDateChange} />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item label="Customer Code" name="customerCode">
                    <Select
                      placeholder="Please Select"
                      options={config.customerCodeOptions}
                      onChange={this.handleCustomerCodeSelectChange}
                    />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item label="Ship Method" name="shipMethod">
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
                  <Form.Item label="Invoice Code" name="invoiceCode">
                    <Input />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    label="Additional Cost"
                    name="additionalCost"
                    initialValue={0.0}
                  >
                    <InputNumber />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    label="Deposit Amt"
                    name="depositAmt"
                    initialValue={0.0}
                  >
                    <InputNumber />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item label="Invoice Dt" name="invoiceDt">
                    <DatePicker
                      value={formData.invoiceDt}
                    />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item label="Invoice Due" name="invoiceDue">
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
          let totalPCs = 0;
          let totalCartons = 0;
          let subTotal = 0;
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
                    <p>PO: {formData.customerCode}</p>
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
              // style={{ cursor: step === item.key ? 'default' : 'pointer' }}
            />
          ))}
        </Steps>
        <div>{steps[step - 1].content()}</div>
      </div>
    );
  }
}

export default NewShipment;
