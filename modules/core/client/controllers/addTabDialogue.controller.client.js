'use strict';

angular.module('tropicalbs')
  .controller('AddTabDialogueController', AddTabDialogueController);

  AddTabDialogueController.$inject =  ['$mdDialog', 'tabsService'];

/**
 * Manages the view of the Tabs Admin view which displays a list of pages and an interface to perform operations on them
 */
function AddTabDialogueController ($mdDialog, tabsService) {
  var vm = this;
  vm.cancel = cancel;
  vm.hide = hide;
  vm.saveTab = saveTab;
  vm.tab = {};


  //////////

  function hide () {
    $mdDialog.hide();
  }

  function cancel () {
    $mdDialog.cancel();
    console.log('cancelled');
  }

  function displayError() {
    console.log('there has been an error saving the tab');
  }

  function saveTab () {
    // TODO tabsService
    tabsService.createTab(vm.tab)
      .then(showSuccess)
      .catch(displayError);
  }

  function showSuccess () {
    $mdDialog.hide();
    console.log('success !!!');
  }

}
