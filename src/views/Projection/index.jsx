// import {
//   SearchOutlined,
//   PlusOutlined,
//   DeleteOutlined,
// } from '@ant-design/icons';
// import { Search, Region, Table, Dialog, Form } from 'freedomen';
// import { useState, useCallback, useEffect } from 'react';
// import { message, Modal } from 'antd';
// import projectionService from 'services/Projection';
// import styles from './index.module.less';

// export default function Projection() {
//   const [selection, setSelection] = useState([]);
//   const [pagination, setPagination] = useState({ total: 0 });
//   const [loading, setLoading] = useState();
//   const loadData = useCallback(() => {
//     setLoading(true);
//     projectionService.select(searchParams).then((res) => {
//       setLoading(false);
//       if (res.success) {
//         //此处的数据结构可能不同，需要修改
//         setPagination({ total: res.data.total });
//         setTableData(res.data.records);
//         setSelection([]);
//       }
//     });
//   }, [searchData]);
//   const regionEvent = (params) => {
//     if (params.prop === 'add' && params.type === 'click') {
//       Dialog.open('fdialog', 'Projection').then((set) => set(getDialogForm()));
//     } else if (params.prop === 'dels' && params.type === 'click') {
//       Modal.confirm({
//         content: '确定要删除选中的' + selection.length + '条数据？',
//         onOk() {
//           //此处id按实际字段名取
//           projectionService
//             .deletes(selection.map((el) => el.id))
//             .then((res) => {
//               message.success('删除成功！');
//               loadData();
//             });
//         },
//       });
//     }
//   };
//   const getDialogForm = (formData) => {
//     return (
//       <Form
//         onSubmit={(data) => {
//           Dialog.loading('fdialog');
//           projectionService
//             .update(data)
//             .then((res) => {
//               //也可以根据是否有 id 不同提示
//               message.success('操作成功！');
//               loadData();
//               Dialog.close('fdialog');
//             })
//             .catch((e) => {
//               Dialog.loading('fdialog', false);
//             });
//         }}
//         data={formData}
//         columns={[
//           {
//             type: 'treeselect@w200',
//             prop: 'customerCode',
//             label: 'Customer Code',
//             disabled: ({ value, data }) => {},
//           },
//           {
//             type: 'input@w200',
//             prop: 'houseBlNum',
//             label: 'Bill of Landing',
//             config: { allowClear: true },
//           },
//           {
//             type: 'input@w200',
//             prop: 'masterPo',
//             label: 'Master PO',
//             config: { allowClear: false },
//           },
//           { type: 'input@w200', prop: 'rmbInv', label: 'RMB Invoice' },
//           { type: 'input@w200', label: '装运日期' },
//           { type: 'input@w200', prop: 'shipFrom', label: 'Ship From' },
//           { type: 'input@w200', prop: 'shipMethod', label: 'Ship Method' },
//           {
//             type: 'input@w200',
//             prop: 'origCountry',
//             label: 'Country of Origin',
//           },
//           { type: 'input@w200', prop: 'ubcPi', label: 'UBC PI' },
//           { type: 'input@w200', prop: 'shipTerm', label: 'Term' },
//           { type: 'input@w200', prop: 'masterBlNum', label: 'Master Bl Num' },
//           { type: 'input@w200', prop: 'exporter', label: 'Exporter' },
//           { type: 'input@w200', prop: 'shipName', label: 'Ship Name' },
//           { type: 'input@w200', prop: 'shipDt', label: 'Ship Dt' },
//           { type: 'input@w200', prop: 'arriveDt', label: 'ETD Dt' },
//           { type: 'input@w200', prop: 'invoiceTtl', label: 'Invoice Ttl' },
//           { type: 'input@w200', prop: 'notes', label: 'Notes' },
//         ]}
//       />
//     );
//   };
//   useEffect(() => {
//     loadData();
//   }, [loadData]);
//   return (
//     <div className={'freedomen-page'}>
//       <Search
//         className={'f-search'}
//         columns={[
//           { type: 'input', prop: 'houseBlNum', label: 'CUSTOMER' },
//           { type: 'input', prop: 'shipFrom', label: 'CUSTOMER P.O.' },
//           {
//             type: 'button-primary',
//             prop: 'search',
//             value: 'search',
//             config: { icon: <SearchOutlined /> },
//           },
//         ]}
//       />
//       <Region
//         onEvent={regionEvent}
//         columns={[
//           [
//             {
//               type: 'button-primary',
//               prop: 'add',
//               value: '添加',
//               load: ({ value, data }) => {
//                 return true;
//               },
//               config: { icon: <PlusOutlined />, ghost: false },
//             },
//             { type: 'upload' },
//             {
//               type: 'button',
//               prop: 'dels',
//               value: '删除选中',
//               load: ({ value, data }) => {
//                 return selection.length;
//               },
//               config: { danger: true, icon: <DeleteOutlined /> },
//             },
//             { type: 'space' },
//           ],
//         ]}
//       />
//       <Table
//         pagination={false}
//         config={{ bordered: false, selection: false }}
//         columns={[
//           { type: 'text', label: 'Ex-FTY&In House', value: 'text' },
//           { type: 'text', label: 'CUSTOMER', value: 'text' },
//           { type: 'text', label: 'CUSTOMER P.O.', value: 'text' },
//           { type: 'text', label: 'STYLE NO', value: 'text' },
//           { type: 'text', label: 'DESC/STYLE NAME', value: 'text' },
//           { type: 'text', label: ' COLOR', value: 'text' },
//           { type: 'text', label: 'FABRICATION', value: 'text' },
//           { type: 'text', label: 'QTY/PC', value: 'text' },
//           { type: 'text', label: 'BUY', value: 'text' },
//           { type: 'text', label: 'TTL BUY', value: 'text' },
//           { type: 'text', label: 'SELL', value: 'text' },
//           { type: 'text', label: 'TTL SELL', value: 'text' },
//           { type: 'text', label: 'VENDOR', value: 'text' },
//           { type: 'text', label: 'WATER RESISTANT ( Y/N)', value: 'text' },
//           { type: 'text', label: 'NOTE', value: 'text' },
//           { type: 'text', label: 'Country&Brand ID', value: 'text' },
//           {
//             render() {
//               return [
//                 { type: 'progress' },
//                 { type: 'button', value: '编辑' },
//                 { type: 'space' },
//               ];
//             },
//           },
//         ]}
//       />
//       <Dialog name={'fdialog'} />
//     </div>
//   );
// }
