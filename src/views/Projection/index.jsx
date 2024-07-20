import {
  SearchOutlined,
  PlusOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import { Search, Region, Table, Dialog, Form } from 'freedomen';
import { useState, useCallback, useEffect } from 'react';
import { message, Modal } from 'antd';
import { history } from 'libs/util';
import projectionService from 'services/Projection';
import styles from './index.module.less';
import * as systemConfig from 'systemConfig';
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
    pageSize: 15,
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
    setLoading(true);
    console.log('searchParams:', searchParams);
    projectionService
      .search(searchParams)
      .then((res) => {
        console.log('Response is successful:', res);

        setLoading(false);
        console.log('search response:', res);
        console.log(res);
        setPagination({
          total: res.data.total,
          pageNo: res.data.pageNo,
          pageSize: res.data.pageSize,
        }).catch((error) => {
          setLoading(false);
          console.error(error);
        });
        const transformedData = transformData(res.data.res);
        setTableData([...tableData, ...transformedData]);
        setSelection([]);
      })
      .catch((error) => {
        setLoading(false);
        console.error(error);
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
      Dialog.open('fdialog', '新增').then((set) =>
        set(getDialogForm(params.row))
      );
    } else if (params.prop === 'dels' && params.type === 'click') {
      Modal.confirm({
        content: '确定要删除选中的' + selection.length + '条数据？',
        onOk() {
          //此处id按实际字段名取
          //   projectionService
          //     .deletes(selection.map((el) => el.id))
          //     .then((res) => {
          //       message.success('删除成功！');
          //       loadData();
          //     });
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
      projectionService
        .remove(params.row)
        .then((res) => {
          message.success('删除成功！');
          loadData();
        })
        .catch((error) => {
          setLoading(false);
          console.error(error);
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
        config={{ labelCol: { span: 8 } }}
        onSubmit={(data) => {
          Dialog.loading('fdialog');
          projectionService
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
            type: 'input@w200',
            prop: 'exFtyInHouse',
            label: 'Ex-FTY/In House',
            disabled: ({ value, data }) => {},
          },
          {
            type: 'input@w200',
            prop: 'customer',
            label: 'CUSTOMER',
            config: { allowClear: true },
          },
          {
            type: 'input@w200',
            prop: 'customerPo',
            label: 'CUSTOMER P.O.',
            config: { allowClear: false },
          },
          { type: 'input@w200', prop: 'styleNo', label: 'STYLE NO' },
          {
            type: 'input@w200',
            prop: 'descStyleName',
            label: 'DESC/STYLE NAME',
          },
          { type: 'input@w200', prop: 'color', label: 'COLOR' },
          { type: 'input@w200', prop: 'fabrication', label: 'FABRICATION' },
          { type: 'input@w200', prop: 'qtyPc', label: 'QTY/PC' },
          { type: 'input@w200', prop: 'buy', label: 'BUY' },
          { type: 'input@w200', prop: 'ttlBuy', label: 'TTL BUY' },
          { type: 'input@w200', prop: 'sell', label: 'SELL' },
          { type: 'input@w200', prop: 'ttlSell', label: 'TTL SELL' },
          { type: 'input@w200', prop: 'vendor', label: 'VENDOR' },
          {
            type: 'input@w200',
            prop: 'waterResistant',
            label: 'WATER RESISTANT / Y/N',
          },
          { type: 'input@w200', prop: 'note', label: 'NOTE' },
          {
            type: 'input@w200',
            prop: 'countryBrandId',
            label: 'Country&Brand ID',
          },
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
          { type: 'input', prop: 'searchParams', label: '' },
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
              value: '新增',
              config: { icon: <PlusOutlined /> },
            },
            {
              type: 'upload-primary',
              prop: 'upload',
              config: {
                // filetypes: ['pdf'],
                // fileexts: ['pdf'],
                action: `${systemConfig.baseURL}/common/upload?usedFor=projection`,
                onSuccess: (res) => {
                  if (res.code === 200) {
                    loadData();
                  } else {
                    message.error(`Error: ${res.msg}`);
                  }
                  console.log(res);
                },
              },
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
            prop: 'arriveDt',
            label: 'Ex-FTY/In House',
          },
          {
            type: 'text',
            prop: 'customerCode',
            label: 'CUSTOMER',
          },
          {
            type: 'text',
            prop: 'customerPo',
            label: 'CUSTOMER P.O.',
          },
          {
            type: 'text',
            prop: 'styleCode',
            label: 'STYLE NO',
          },
          {
            type: 'text',
            prop: 'styleName',
            label: 'DESC/STYLE NAME',
          },
          {
            type: 'text',
            prop: 'color',
            label: 'COLOR',
          },
          {
            type: 'text',
            prop: 'fabrication',
            label: 'FABRICATION',
          },
          {
            type: 'text',
            prop: 'poQty',
            label: 'QTY/PC',
          },
          {
            type: 'text',
            prop: 'costPrice',
            label: 'BUY',
          },
          {
            type: 'text',
            prop: 'ttlBuy',
            label: 'TTL BUY',
          },
          {
            type: 'text',
            prop: 'salePrice',
            label: 'SELL',
          },
          {
            type: 'text',
            prop: 'ttlSell',
            label: 'TTL SELL',
          },
          {
            type: 'text',
            prop: 'exporter',
            label: 'VENDOR',
          },
          {
            type: 'text',
            prop: 'waterResistant',
            label: 'WATER RESISTANT / Y/N',
          },
          {
            type: 'text',
            prop: 'notes',
            label: 'NOTE',
          },
          {
            type: 'text',
            prop: 'country',
            label: 'Country&Brand ID',
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
