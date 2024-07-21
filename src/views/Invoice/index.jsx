import {
  SearchOutlined,
  PlusOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import { Search, Region, Table, Dialog, Form } from 'freedomen';
import { useState, useCallback, useEffect } from 'react';
import { message, Modal } from 'antd';
import { history } from 'libs/util';
import shipmentService from 'services/Shipment';
import styles from './index.module.less';

export default function Shipment() {
  // 定义转换数据的函数
  function transformData(data) {
    return data.map((item) => {
      return {
        ...item,
        packDt: formatDate(item.packDt),
        shipDt: formatDate(item.shipDt),
        arriveDt: formatDate(item.arriveDt),
      };
    });
  }

  const [searchParams, setSearchParams] = useState({
    pageNo: 1,
    pageSize: 10,
  });
  // 格式化日期字段的函数
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // 月份从0开始，所以要加1
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [tableData, setTableData] = useState([]);
  const [selection, setSelection] = useState([]);
  const [loading, setLoading] = useState();
  const [pagination, setPagination] = useState({ total: 0 });
  const loadData = useCallback(() => {
    console.log('loadData called');
    // setLoading(true);
    console.log('searchParams:', searchParams);
    shipmentService.search(searchParams).then((res) => {
      console.log('Response is successful:', res);

      setLoading(false);
      console.log('search response:', res);
      console.log(res);
      setPagination({
        total: res.data.total,
        pageNo: res.data.pageNo,
        pageSize: res.data.pageSize,
      });
      const transformedData = transformData(res.data.res);
      setTableData([...tableData, ...transformedData]);
      setSelection([]);
    });
  }, [searchParams]);
  const setReSearch = useCallback((row) => {
    setSearchParams({ ...row, pageNo: 1 });
  }, []);
  const searchEvent = (params) => {
    if (params.prop === 'search' && params.type === 'click') {
      setSearchParams(params.row);
    }
  };
  const regionEvent = (params) => {
    if (params.prop === 'add' && params.type === 'click') {
      history.push('/newshpiment');
    } else if (params.prop === 'dels' && params.type === 'click') {
      Modal.confirm({
        content: '确定要删除选中的' + selection.length + '条数据？',
        onOk() {
          //此处id按实际字段名取
          shipmentService.deletes(selection.map((el) => el.id)).then((res) => {
            message.success('删除成功！');
            loadData();
          });
        },
      });
    }
  };
  const tableEvent = (params) => {
    if (params.prop === 'edit' && params.type === 'click') {
      Dialog.open('fdialog', '编辑').then((set) =>
        set(getDialogForm(params.row))
      );
    } else if (params.prop === 'pdel' && params.type === 'confirm') {
      shipmentService.remove(params.row).then((res) => {
        message.success('删除成功！');
        loadData();
      });
    } else if (params.prop === '$page') {
      setSearchParams({
        ...searchParams,
        pageNo: params.value.pageNo,
        pageSize: params.value.pageSize,
      });
    } else if (params.prop === '$selection') {
      setSelection(params.value);
    }
  };
  const getDialogForm = (formData) => {
    return (
      <Form
        onSubmit={(data) => {
          Dialog.loading('fdialog');
          shipmentService
            .update(data)
            .then((res) => {
              //也可以根据是否有 id 不同提示
              message.success('操作成功！');
              loadData();
              Dialog.close('fdialog');
            })
            .catch((e) => {
              Dialog.loading('fdialog', false);
            });
        }}
        data={formData}
        columns={[
          {
            type: 'text',
            prop: 'customerCode',
            label: 'Customer Code',
            disabled: ({ value, data }) => {},
          },
          {
            type: 'text',
            prop: 'houseBlNum',
            label: 'Bill of Landing',
            config: { allowClear: true },
          },
          {
            type: 'text',
            prop: 'masterPo',
            label: 'Master PO',
            config: { allowClear: false },
          },
          { type: 'text', prop: 'rmbInv', label: 'RMB Invoice' },
          { type: 'text', label: '装运日期' },
          { type: 'text', prop: 'shipFrom', label: 'Ship From' },
          { type: 'text', prop: 'shipMethod', label: 'Ship Method' },
          {
            type: 'text',
            prop: 'origCountry',
            label: 'Country of Origin',
          },
          { type: 'text', prop: 'ubcPi', label: 'UBC PI' },
          { type: 'text', prop: 'shipTerm', label: 'Term' },
          { type: 'text', prop: 'masterBlNum', label: 'Master Bl Num' },
          { type: 'text', prop: 'exporter', label: 'Exporter' },
          { type: 'text', prop: 'shipName', label: 'Ship Name' },
          { type: 'text', prop: 'shipDt', label: 'Ship Dt' },
          { type: 'text', prop: 'arriveDt', label: 'ETD Dt' },
          { type: 'text', prop: 'invoiceTtl', label: 'Invoice Ttl' },
          { type: 'text', prop: 'notes', label: 'Notes' },
        ]}
      />
    );
  };
  useEffect(() => {
    loadData();
  }, [loadData]);
  return (
    <div className={'freedomen-page'}>
      <Search
        className={'f-search'}
        onEvent={searchEvent}
        columns={[
          { type: 'input', prop: 'houseBlNum', label: 'Bill of Landing' },
          { type: 'input', prop: 'shipFrom', label: 'Ship From' },
          {
            type: 'button-primary',
            prop: 'search',
            value: 'search',
            config: { icon: <SearchOutlined /> },
          },
        ]}
      />
      <Region
        onEvent={regionEvent}
        columns={[
          [
            {
              type: 'button-primary',
              prop: 'add',
              value: '新出运',
              config: { icon: <PlusOutlined /> },
            },
            {
              type: 'button',
              prop: 'dels',
              value: '删除选中',
              load: ({ value, data }) => {
                return selection.length;
              },
              config: { danger: true, icon: <DeleteOutlined /> },
            },
            { type: 'space' },
          ],
        ]}
      />
      <Table
        className={'f-table'}
        data={tableData}
        onEvent={tableEvent}
        pagination={pagination}
        config={{ selection: true, loading: loading }}
        columns={[
          {
            type: 'text',
            prop: 'houseBlNum',
            label: 'Bill of Landing',
            value: 'text',
          },
          { type: 'text', prop: 'itemCnt', label: 'Item Cnt', value: 'text' },
          {
            type: 'text',
            prop: 'cartonSize',
            label: 'Total Volume',
            value: 'text',
          },
          {
            type: 'text',
            prop: 'grossWeight',
            label: 'Total Weight',
            value: 'text',
          },
          {
            type: 'text',
            prop: 'customerCode',
            label: 'Customer Code',
            value: 'text',
          },
          { type: 'text', prop: 'shipFrom', label: 'Ship From', value: 'text' },
          { type: 'text', prop: 'exporter', label: 'Exporter', value: 'text' },
          { type: 'text', prop: 'shipName', label: 'Ship Name', value: 'text' },
          { type: 'text', prop: 'shipDt', label: 'ETD Dt', value: 'text' },
          { type: 'text', prop: 'notes', label: 'Notes', value: 'text' },
          {
            type: 'input',
            label: 'asdasd',
            load: ({ value, data }) => {
              return false;
            },
          },
          {
            label: '操作',
            width: 200,
            render() {
              return [
                {
                  type: 'button-link',
                  prop: 'edit',
                  value: '编辑',
                  className: styles['edit'],
                },
                [
                  {
                    type: 'button-link',
                    prop: 'del',
                    value: '删除',
                    config: { danger: true },
                    className: styles['del'],
                  },
                  {
                    type: 'popconfirm',
                    prop: 'pdel',
                    value: '确定要删除该数据？',
                  },
                ],
                { type: 'space', config: { fixed: 'right' } },
              ];
            },
          },
          {
            render() {
              return <Region columns={[null]} />;
            },
          },
        ]}
      />
      <Dialog name={'fdialog'} />
    </div>
  );
}
