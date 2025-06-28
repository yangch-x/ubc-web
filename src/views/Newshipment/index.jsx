import { PlusOutlined, UploadOutlined } from '@ant-design/icons';
import { baseURL } from 'systemConfig';

import axios from 'axios'; // 引入原生的axios,不作封装处理
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
import moment from 'moment';
import { history } from 'libs/util';
import React, { Component } from 'react';
import customerService from 'services/Customer';
import shipmentService from 'services/Shipment';
import packingService from 'services/Packing';
import FileUpload from 'views/Components/FileUpload';
import { hideLoading, showLoading } from 'views/Components/Loading';
import styles from './index.module.less';
import * as util from 'libs/util';

const { Step } = Steps;
let idCounter = 0;
let totalPCs = 0;
let totalCartons = 0;
let subTotal = 0;
function generateUniqueId() {
  return idCounter++;
}
const createInvoice = async (saveShipmentData) => {
  try {
    // 显示加载
    showLoading();

    const response = await axios.post(
      `${baseURL}/shipment/createInvoice`,
      saveShipmentData,
      {
        responseType: 'arraybuffer',
        headers: {
          Authorization: `Bearer ${util.getToken()}`,
        },
      }
    );

    // 隐藏加载
    hideLoading();

    // 显示成功消息
    message.success('Invoice created successfully!');

    // 转换pdf
    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    window.open(url);
    history.push('/shipment');
  } catch (error) {
    // 隐藏加载
    hideLoading();

    // 处理错误
    console.error(error);
  }
};
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
        if (res.code !== 200) {
          message.error(`${res.msg}`);
          return;
        }
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

    const params = new URLSearchParams(this.props.location.search);
    const shipId = params.get('shipId');
    if (shipId !== null) {
      this.handleStepChange(2);
      showLoading();
      // 查询packing
      const p = { shipId: shipId };
      packingService
        .searchPacking(p)
        .then((res) => {
          if (res.code !== 200) {
            message.error(`${res.msg}`);
            hideLoading();
            return;
          }
          hideLoading();
          if (res.data.packings === null) {
            res.data.packings = [];
          }
          const etdDtFormatted = moment(res.data.shipment.shipDt, 'YYYY-MM-DD');
          const invoiceDtFormatted = moment(
            res.data.shipment.invoiceDt,
            'YYYY-MM-DD'
          );
          const invoiceDueFormatted = moment(
            res.data.shipment.invoiceDue,
            'YYYY-MM-DD'
          );

          // Map API response fields to form fields correctly
          const formData = {
            ...res.data.shipment,
            etdDt: etdDtFormatted,
            invoiceDt: invoiceDtFormatted,
            invoiceDue: invoiceDueFormatted,
          };

          this.setState(
            (prevState) => ({
              formData: formData,
              tableData: res.data.packings,
              region: {
                ...prevState.region,
                common: {
                  ...prevState.region.common,
                  invoiceId: res.data.shipment.invoiceId,
                  shipmentId: res.data.shipment.shipId,
                },
              },
            }),
            () => {
              // Update form fields after state is set
              if (this.form1Ref.current) {
                this.form1Ref.current.setFieldsValue(formData);
              }
            }
          );
        })
        .catch((error) => {
          console.error(error);
        });
    }
  }

  handleStepChange = (currentStep) => {
    console.log(this.setState.config);
    this.setState({ step: currentStep }, () => {
      // When switching to step 1, ensure form is updated with current data
      if (currentStep === 1 && this.form1Ref.current) {
        this.form1Ref.current.setFieldsValue(this.state.formData);
      }
    });
  };

  handleFormSubmit = (values) => {
    const additionalCost = values.additionalCost;
    const additionalCostDescription = values.additionalCostDescription;

    if (
      additionalCost !== undefined &&
      additionalCost !== 0 &&
      !additionalCostDescription
    ) {
      message.error('附加费用描述信息未填写');
      return;
    }

    if (!additionalCost && additionalCostDescription) {
      message.error('附加费用未填写');
      return;
    }

    showLoading();
    const customerDueDate =
      this.state.config.customerDueDateMap[values.customerCode];
    console.log(customerDueDate);

    if (!customerDueDate) {
      message.error(
        'Customer information not found. Please select a valid customer code.'
      );
      hideLoading();
      return;
    }

    values.billingContact = customerDueDate.billingContact;
    values.shipTo = customerDueDate.shipTo;
    values.term = customerDueDate.paymentTerm;

    values.depositAmt = 0 - values.depositAmt;
    this.setState({
      formData: values,
    });

    const { region, step } = this.state;
    values.invoiceId = region.common.invoiceId;
    values.shipmentId = region.common.shipmentId;
    shipmentService
      .saveShipmentAndIVoice(values)
      .then((res) => {
        if (res.code !== 200) {
          message.error(`${res.msg}`);
          hideLoading();
          return;
        }
        hideLoading();
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

  handleCreateInvoice = () => {
    showLoading();
    const { tableData, formData } = this.state;
    const saveShipmentData = {
      shipment: formData,
      packings: tableData,
      invoice: {
        invoiceCode: formData.invoiceCode,
        totalPCs: totalPCs,
        totalCartons: totalCartons,
        subTotal: parseFloat(subTotal.toFixed(2)),
      },
    };

    createInvoice(saveShipmentData);
    // shipmentService
    //   .createInvoice(saveShipmentData, { responseType: 'arraybuffer' })
    //   .then((response) => {
    //     message.success('Invoice created successfully!');
    //     hideLoading();

    //     // 转换pdf
    //     const blob = new Blob([response], { type: 'application/pdf' });
    //     const url = window.URL.createObjectURL(blob);
    //     window.open(url);
    //   })
    //   .catch((error) => {
    //     hideLoading();
    //     console.error(error);
    //   });
  };

  handleUploadChange = (info) => {
    if (info.file.status === 'done') {
      const response = info.file.response;

      if (response.code === 200) {
        const newData = response.data.res;
        newData.forEach((item) => {
          const po = item.customerPo;
          const style = item.styleCode;
          const color = item.color;

          const project = this.calculateProjectInfo(po, style, color);
          item.salePrice = project.salePrice;
          item.styleName = project.styleName;
          item.fabrication = project.fabrication;
          item.size = project.size;
          item.projId = project.projId;
          // 为每个新项目添加唯一ID
          item.id = generateUniqueId();
        });

        // 修改这里：使用展开运算符将新数据追加到现有数据
        this.setState((prevState) => ({
          tableData: [...prevState.tableData, ...newData],
        }));
      } else {
        message.error(`Error: ${response.msg}`);
      }
    } else if (info.file.status === 'error') {
      message.error(`${info.file.name} file upload failed.`);
    }
  };

  calculateProjectInfo = (po, style, color) => {
    console.log(po, style, color);
    const key = `${color}|${style}|${po}`;
    const value = this.state.config.csc[key];
    let salePrice = 0;
    let styleName = '';
    let projId = '';
    let fabrication = 0;
    let size = '';
    if (value) {
      salePrice = value.salePrice;
      styleName = value.styleName;
      fabrication = value.fabrication;
      projId = value.projID;
      size = value.size;
    } else {
      console.log('Key not found in csc', key);
    }
    return {
      salePrice: salePrice,
      styleName: styleName,
      fabrication: fabrication,
      size: size,
      projId: projId,
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
          newData.projId = project.projId;
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

    // Only update ETD date and Invoice Date, don't calculate Invoice Due here
    this.setState(
      {
        formData: {
          ...formData,
          etdDt: date,
          invoiceDt: date, // Set Invoice Date to same as ETD Date initially
        },
      },
      () => {
        // Update form fields
        this.form1Ref.current?.setFieldsValue({
          invoiceDt: this.state.formData.invoiceDt,
        });

        // Recalculate Invoice Due if customer is selected
        if (formData.customerCode && date) {
          const gap =
            this.state.config.customerDueDateMap[formData.customerCode]
              .dueDateGap;
          const invoiceDue = date.clone().add(gap, 'days');
          this.setState(
            {
              formData: {
                ...this.state.formData,
                invoiceDue: invoiceDue,
              },
            },
            () => {
              this.form1Ref.current?.setFieldsValue({
                invoiceDue: this.state.formData.invoiceDue,
              });
            }
          );
        }
      }
    );
  };

  handleInvoiceDtDateChange = (date, dateString) => {
    console.log('Invoice date selected: ', date);
    console.log('Invoice date formatted: ', dateString);

    let { formData } = this.state;

    this.setState(
      {
        formData: {
          ...formData,
          invoiceDt: date,
        },
      },
      () => {
        // Recalculate Invoice Due if customer is selected
        if (formData.customerCode && date) {
          const gap =
            this.state.config.customerDueDateMap[formData.customerCode]
              .dueDateGap;
          const invoiceDue = date.clone().add(gap, 'days');
          this.setState(
            {
              formData: {
                ...this.state.formData,
                invoiceDue: invoiceDue,
              },
            },
            () => {
              this.form1Ref.current?.setFieldsValue({
                invoiceDue: this.state.formData.invoiceDue,
              });
            }
          );
        }
      }
    );
  };

  handleCustomerCodeSelectChange = (value) => {
    const customerDueDate = this.state.config.customerDueDateMap[value];
    console.log('Selected Customer Code: ', customerDueDate);

    let { formData } = this.state;
    let invoiceDue = formData.invoiceDue;

    // Calculate Invoice Due based on Invoice Date + gap, not ETD Date
    if (formData.invoiceDt) {
      invoiceDue = formData.invoiceDt
        .clone()
        .add(customerDueDate.dueDateGap, 'days');
    }

    this.setState(
      {
        formData: {
          ...formData,
          customerCode: value,
          invoiceDue,
        },
      },
      () => {
        this.form1Ref.current?.setFieldsValue({
          invoiceDue: this.state.formData.invoiceDue,
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
                    // rules={[
                    //   {
                    //     required: true,
                    //     message: 'Vessel/Flight is required',
                    //   },
                    // ]}
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
                        type: 'number',
                        min: 0.0,
                        message: 'Additional Cost must be greater than 0',
                      },
                    ]}
                  >
                    <InputNumber />
                  </Form.Item>
                </Col>

                <Col span={8}>
                  <Form.Item
                    label="Additional Cost Description"
                    name="additionalCostDescription"
                  >
                    <Input />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={24}>
                <Col span={8}>
                  <Form.Item
                    label="Deposit Amt"
                    name="receivedAmt"
                    initialValue={0.0}
                    rules={[
                      {
                        type: 'number',
                        min: 0,
                        message: 'Deposit Amt must be greater than 0',
                      },
                    ]}
                  >
                    <InputNumber />
                  </Form.Item>
                </Col>
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
                    <DatePicker onChange={this.handleInvoiceDtDateChange} />
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
                    if (this.state.tableData.length === 0) {
                      message.error('packing data cannot be empty.');
                      return;
                    }
                    const customerPos = this.state.tableData
                      .map((item) => item.customerPo)
                      .join('/');

                    this.setState((prevState) => ({
                      formData: {
                        ...prevState.formData,
                        customerPos: customerPos,
                      },
                    }));

                    // 保存packing
                    const createPackings = {
                      createPackings: this.state.tableData,
                      shipId: this.state.region.common.shipmentId,
                    };
                    packingService
                      .savePacking(createPackings)
                      .then((res) => {
                        if (res.code !== 200) {
                          message.error(`${res.msg}`);
                          hideLoading();
                          return;
                        }
                        message.success('packing save successfully!');
                        // history.push('/shipment');
                        hideLoading();
                        this.handleStepChange(3);
                      })
                      .catch((error) => {
                        hideLoading();
                        console.error(error);
                      });
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
            totalPCs += item.totalQuantity;
            totalCartons += item.cartonCnt;
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
