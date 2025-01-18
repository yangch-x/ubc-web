import {
  SearchOutlined,
  PlusOutlined,
  DeleteOutlined,
  SortAscendingOutlined,
  SortDescendingOutlined,
  DownloadOutlined,
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
    pageSize: 10,
  });

  const [tableData, setTableData] = useState([]);
  const [selection, setSelection] = useState([]);
  const [sortField, setSortField] = useState(null);
  const [sortOrder, setSortOrder] = useState(null);
  const [loading, setLoading] = useState();
  const [pagination, setPagination] = useState({ total: 0 });
  const loadData = useCallback(() => {
    setLoading(true);
    shipmentService
      .search(searchParams)
      .then((res) => {
        setLoading(false);
        if (res.code !== 200) {
          message.error(`${res.msg}`); // 显示错误消息
        } else {
          setPagination({
            total: res.data.total,
            pageNo: res.data.pageNo,
            pageSize: res.data.pageSize,
          });
          setTableData(res.data.res);
          setSelection([]);
        }
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
      const searchData = { ...params.row };

      // 格式化日期
      if (searchData.dueDate) {
        const date = new Date(searchData.dueDate);
        searchData.dueDate = `${date.getFullYear()}-${String(
          date.getMonth() + 1
        ).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      }

      setSearchParams({
        ...searchParams,
        ...searchData,
        pageNo: 1,
      });
    }
  };
  const regionEvent = (params) => {
    if (params.prop === 'add' && params.type === 'click') {
      history.push('/newshipment');
    } else if (params.prop === 'dels' && params.type === 'click') {
      Modal.confirm({
        content: '确定要删除选中的' + selection.length + '条数据？',
        onOk() {
          //此处id按实际字段名取
          //   shipmentService.deletes(selection.map((el) => el.id)).then((res) => {
          //     message.success('删除成功！');
          //     loadData();
          //   });
        },
      });
    } else if (params.prop === 'export' && params.type === 'click') {
      if (selection.length === 0) {
        message.warning('请先选择要导出的数据！'); // 提示用户选择数据
        return; // 退出函数
      }
      shipmentService
        .downloadShipment({ selection })
        .then((res) => {
          const blob = new Blob([res], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = '发票数据.xlsx';
          document.body.appendChild(a);
          a.click();
          a.remove();
          window.URL.revokeObjectURL(url);
          message.success('下载成功！');
        })
        .catch((error) => {
          console.error(error);
          message.error('下载失败！');
        });
    }
  };
  const tableEvent = (params) => {
    if (params.prop === 'edit' && params.type === 'click') {
      Dialog.open('fdialog', '编辑').then((set) =>
        set(getDialogForm(params.row))
      );
    } else if (params.prop === 'packing' && params.type === 'click') {
      const { shipId } = params.row;
      history.push(`/newshipment?shipId=${shipId}`);
    } else if (params.prop === 'pdel' && params.type === 'confirm') {
      const { shipId } = params.row;
      console.log(shipId);
      shipmentService
        .remove({ shipId })
        .then((res) => {
          if (res.code != 200) {
            message.error(`${res.msg}`); // 显示错误消息
            return;
          }
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
      return sortOrder === 'ascend' ? (
        <SortAscendingOutlined />
      ) : (
        <SortDescendingOutlined />
      );
    }
    return <SortAscendingOutlined style={{ opacity: 0.2 }} />;
  };
  const getDialogForm = (formData) => {
    return (
      <Form
        config={{ labelCol: { span: 6 } }}
        onSubmit={(data) => {
          Dialog.loading('fdialog');
          shipmentService
            .saveOrUpdate(data)
            .then((res) => {
              if (res.code != 200) {
                message.error(`${res.msg}`); // 显示错误消息
                return;
              }
              message.success('操作成功！');
              loadData();
              Dialog.close('fdialog');
            })
            .catch((error) => {
              setLoading(false);
              console.error(error);
              Dialog.loading('fdialog', false);
            });
        }}
        data={formData}
        columns={[
          {
            type: 'input@w200',
            prop: 'customerCode',
            label: 'Customer Code',
          },
          {
            type: 'input@w200',
            prop: 'houseBlNum',
            label: 'Bill of Landing',
            config: { allowClear: true },
          },
          {
            type: 'input@w200',
            prop: 'masterPo',
            label: 'Master PO',
            config: { allowClear: false },
          },
          { type: 'input@w200', prop: 'rmbInv', label: 'RMB Invoice' },
          { type: 'input@w200', prop: 'shipFrom', label: 'Ship From' },
          { type: 'input@w200', prop: 'shipMethod', label: 'Ship Method' },
          {
            type: 'input@w200',
            prop: 'origCountry',
            label: 'Country of Origin',
          },
          { type: 'input@w200', prop: 'ubcPi', label: 'UBC PI' },
          { type: 'input@w200', prop: 'shipTerm', label: 'Term' },
          { type: 'input@w200', prop: 'masterBlNum', label: 'Master Bl Num' },
          { type: 'input@w200', prop: 'exporter', label: 'Exporter' },
          { type: 'input@w200', prop: 'shipName', label: 'Ship Name' },
          { type: 'input@w200', prop: 'shipDt', label: 'Ship Dt' },
          { type: 'input@w200', prop: 'arriveDt', label: 'ETD Dt' },
          { type: 'input@w200', prop: 'invoiceTtl', label: 'Invoice Ttl' },
          { type: 'input@w200', prop: 'notes', label: 'Notes' },
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
          {
            type: 'input',
            prop: 'searchParams',
            label: '',
            placeholder: 'Invoice Code',
          },
          {
            type: 'date@YYYY-MM-DD',
            prop: 'dueDate',
            label: '',
            placeholder: '选择日期',
            config: {
              format: 'YYYY-MM-DD',
              valueFormat: 'YYYY-MM-DD',
            },
          },
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
            {
              type: 'button-primary',
              prop: 'export',
              value: '导出',
              config: { icon: <DownloadOutlined /> },
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
            label: (
              <div
                className="sort-container"
                onClick={() => handleSort('houseBlNum')}
              >
                Bill of Landing {getSortIcon('houseBlNum')}
              </div>
            ),
            sorter: true,
            value: 'text',
          },
          {
            type: 'text',
            prop: 'invoiceCode',
            label: (
              <div
                className="sort-container"
                onClick={() => handleSort('invoiceCode')}
              >
                invoiceCode {getSortIcon('invoiceCode')}
              </div>
            ),
            sorter: true,
            value: '-',
          },
          {
            type: 'text',
            prop: 'subTotal',
            label: (
              <div
                className="sort-container"
                onClick={() => handleSort('subTotal')}
              >
                subTotal {getSortIcon('subTotal')}
              </div>
            ),
            sorter: true,
            value: '0',
          },
          {
            type: 'text',
            prop: 'totalPcs',
            label: (
              <div
                className="sort-container"
                onClick={() => handleSort('totalPCs')}
              >
                totalPCs {getSortIcon('totalPCs')}
              </div>
            ),
            sorter: true,
            value: '0',
          },
          {
            type: 'text',
            prop: 'cartonCnt',
            label: (
              <div
                className="sort-container"
                onClick={() => handleSort('cartonCnt')}
              >
                Carton Cnt {getSortIcon('cartonCnt')}
              </div>
            ),
            sorter: true,
            value: 'text',
          },
          {
            type: 'text',
            prop: 'customerCode',
            label: (
              <div
                className="sort-container"
                onClick={() => handleSort('customerCode')}
              >
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
              <div
                className="sort-container"
                onClick={() => handleSort('shipFrom')}
              >
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
              <div
                className="sort-container"
                onClick={() => handleSort('exporter')}
              >
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
              <div
                className="sort-container"
                onClick={() => handleSort('shipName')}
              >
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
              <div
                className="sort-container"
                onClick={() => handleSort('shipDt')}
              >
                ETD Dt {getSortIcon('shipDt')}
              </div>
            ),
            sorter: true,
            value: 'text',
            width: 120,
          },
          {
            type: 'text',
            prop: 'dueDate',
            label: (
              <div
                className="sort-container"
                onClick={() => handleSort('dueDate')}
              >
                Due Date {getSortIcon('dueDate')}
              </div>
            ),
            sorter: true,
            value: 'text',
            width: 120,
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
                {
                  type: 'button-link',
                  prop: 'packing',
                  value: 'packing',
                  className: styles['e	dit'],
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
