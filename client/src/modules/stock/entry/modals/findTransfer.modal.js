angular.module('bhima.controllers')
  .controller('StockFindTransferModalController', StockFindTransferModalController);

StockFindTransferModalController.$inject = [
  '$uibModalInstance', 'StockService', 'NotifyService', 'uiGridConstants',
  'GridFilteringService', 'ReceiptModal', 'data', 'bhConstants',
];

function StockFindTransferModalController(
  Instance, StockService, Notify,
  uiGridConstants, Filtering, Receipts, data, bhConstants
) {
  var vm = this;
  var filtering;
  var columns;

  vm.filterEnabled = false;
  vm.filterReceived = false;

  vm.gridOptions = { appScopeProvider : vm };

  filtering = new Filtering(vm.gridOptions);

  columns = [
    {
      field : 'status',
      displayName : 'FORM.LABELS.STATUS',
      headerCellFilter : 'translate',
      cellTemplate : 'modules/stock/entry/modals/templates/transfer.status.tmpl.html',
    },

    {
      field : 'date',
      cellFilter       : 'date:"'.concat(bhConstants.dates.format, '"'),
      filter : { condition : filtering.filterByDate },
      displayName : 'TABLE.COLUMNS.DATE',
      headerCellFilter : 'translate',
      sort : { priority : 0, direction : 'desc' },
    },

    {
      field : 'document_reference',
      displayName : 'FORM.LABELS.REFERENCE',
      headerCellFilter : 'translate',
      cellTemplate : 'modules/stock/entry/modals/templates/document_reference.tmpl.html',
    },

    {
      field : 'depot_name',
      displayName : 'FORM.LABELS.ORIGIN',
      headerCellFilter : 'translate',
    },
  ];

  vm.gridOptions.columnDefs = columns;
  vm.gridOptions.multiSelect = false;
  vm.gridOptions.enableFiltering = vm.filterEnabled;
  vm.gridOptions.onRegisterApi = onRegisterApi;
  vm.gridOptions.enableColumnMenus = false;
  vm.gridOptions.fastWatch = true;
  vm.gridOptions.flatEntityAccess = true;

  // bind methods
  vm.submit = submit;
  vm.cancel = cancel;
  vm.showReceipt = showReceipt;
  vm.toggleFilter = toggleFilter;
  vm.toggleReceived = toggleReceived;

  vm.hasError = false;

  function onRegisterApi(gridApi) {
    vm.gridApi = gridApi;
    vm.gridApi.selection.on.rowSelectionChanged(null, rowSelectionCallback);
  }

  function rowSelectionCallback(row) {
    vm.selectedRow = row.entity;
  }

  /** toggle filter */
  function toggleFilter() {
    vm.filterEnabled = !vm.filterEnabled;
    vm.gridOptions.enableFiltering = vm.filterEnabled;
    vm.gridApi.core.notifyDataChange(uiGridConstants.dataChange.COLUMN);
  }

  /** toggle received */
  function toggleReceived() {
    vm.filterReceived = !vm.filterReceived;
    vm.gridOptions.data = vm.filterReceived ? vm.allTransfers : vm.pendingTransfers;
    vm.gridApi.core.notifyDataChange(uiGridConstants.dataChange.COLUMN);
  }

  /** get transfer document */
  function showReceipt(uuid) {
    Receipts.stockExitDepotReceipt(uuid, true);
  }

  function load() {
    vm.loading = true;

    StockService.transfers.read(null, {
      depot_uuid : data.depot_uuid,
    })
      .then(function fillGrid(transfers) {
        vm.allTransfers = transfers;
        vm.pendingTransfers = transfers.filter(transferNotReceived);
        vm.gridOptions.data = vm.pendingTransfers;
      })
      .catch(function handleError(err) {
        vm.hasError = true;
        Notify.errorHandler(err);
      })
      .finally(function handleLoading() {
        vm.loading = false;
      });
  }

  /**
   * @function tranferNotReceived
   * @description filter by not yet received
   */
  function transferNotReceived(transfer) {
    return !transfer.countedReceived;
  }

  // submit
  function submit() {
    if (!vm.selectedRow) { return 0; }
    return StockService.movements.read(null, {
      document_uuid : vm.selectedRow.document_uuid,
      is_exit : 1,
    })
      .then(function close(transfers) {
        Instance.close(transfers);
      })
      .catch(Notify.errorHandler);
  }

  // cancel
  function cancel() {
    Instance.close();
  }

  load();

}
