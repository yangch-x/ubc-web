import {
  SearchOutlined,
  PlusOutlined,
  DeleteOutlined,
  SortAscendingOutlined,
  SortDescendingOutlined,
} from '@ant-design/icons';
import { Search, Region, Table, Dialog, Form } from 'freedomen';
import { useState, useCallback, useEffect } from 'react';
import { message, Modal } from 'antd';
import { history } from 'libs/util';
import shipmentService from 'services/Shipment';
import styles from './index.module.less';

export default function Shipment() {
  const [searchParams, setSearchParams] = useState({
    pageNo: 1,
    pageSize: 15,
  });

  const [tableData, setTableData] = useState([]);
  const [selection, setSelection] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ total: 0 });
  const [sortField, setSortField] = useState(null);
  const [sortOrder, setSortOrder] = useState(null);

  const loadData = useCallback(() => {
    setLoading(true);
    shipmentService.search(searchParams).then((res) => {
      setLoading(false);
      if (res.code !== 200) {
        message.error(`${res.msg}`); // 显示错误消息
        return;
      }
      setPagination({
        total: res.data.total,
        pageNo: res.data.pageNo,
        pageSize: res.data.pageSize,
      });
      setTableData(res.data.res);
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
          // 此处id按实际字段名取
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

  const handleSort = (column) => {
    let order = 'ascend';
    if (column === sortField) {
      order = sortOrder === 'ascend' ? 'descend' : 'ascend';
    }
    setSortField(column);
    setSortOrder(order);

    const sortedData = [...tableData].sort((a, b) => {
      if (order === 'ascend') {
        if (a[column] < b[column]) return -1;
        if (a[column] > b[column]) return 1;
        return 0;
      }
      if (a[column] > b[column]) return -1;
      if (a[column] < b[column]) return 1;
      return 0;
    });

    setTableData(sortedData);
  };

  const getSortIcon = (column) => {
    if (sortField === column) {
      return sortOrder === 'ascend' ? <SortAscendingOutlined /> : <SortDescendingOutlined />;
    }
    return <SortAscendingOutlined style={{opacity: 0.2}} />;
  };

  const getDialogForm = (formData) => {
    return (
      <Form
        onSubmit={(data) => {
          Dialog.loading('fdialog');
          shipmentService
            .update(data)
            .then((res) => {
              // 也可以根据是否有 id 不同提示
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
          { type: 'input', prop: 'houseBlNum', label: '' },
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
            label: (
              <div className="sort-container" onClick={() => handleSort('houseBlNum')}>
                Bill of Landing {getSortIcon('houseBlNum')}
              </div>
            ),
            sorter: true,
            value: 'text',
          },
          {
            type: 'text',
            prop: 'itemCnt',
            label: (
              <div className="sort-container" onClick={() => handleSort('itemCnt')}>
                Item Cnt {getSortIcon('itemCnt')}
              </div>
            ),
            sorter: true,
            value: 'text',
          },
          {
            type: 'text',
            prop: 'cartonSize',
            label: (
              <div className="sort-container" onClick={() => handleSort('cartonSize')}>
                Total Volume {getSortIcon('cartonSize')}
              </div>
            ),
            sorter: true,
            value: 'text',
          },
          {
            type: 'text',
            prop: 'grossWeight',
            label: (
              <div className="sort-container" onClick={() => handleSort('grossWeight')}>
                Total Weight {getSortIcon('grossWeight')}
              </div>
            ),
            sorter: true,
            value: 'text',
          },
          {
            type: 'text',
            prop: 'customerCode',
            label: (
              <div className="sort-container" onClick={() => handleSort('customerCode')}>
                Customer Code {getSortIcon('customerCode')}
              </div>
            ),
            sorter: true,
            value: 'text',
          },
          {
            type: 'text',
            prop: 'shipFrom',
            label: (
              <div className="sort-container" onClick={() => handleSort('shipFrom')}>
                Ship From {getSortIcon('shipFrom')}
              </div>
            ),
            sorter: true,
            value: 'text',
          },
          {
            type: 'text',
            prop: 'exporter',
            label: (
              <div className="sort-container" onClick={() => handleSort('exporter')}>
                Exporter {getSortIcon('exporter')}
              </div>
            ),
            sorter: true,
            value: 'text',
          },
          {
            type: 'text',
            prop: 'shipName',
            label: (
              <div className="sort-container" onClick={() => handleSort('shipName')}>
                Ship Name {getSortIcon('shipName')}
              </div>
            ),
            sorter: true,
            value: 'text',
          },
          {
            type: 'text',
            prop: 'shipDt',
            label: (
              <div className="sort-container" onClick={() => handleSort('shipDt')}>
                ETD Dt {getSortIcon('shipDt')}
              </div>
            ),
            sorter: true,
            value: 'text',
          },
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
