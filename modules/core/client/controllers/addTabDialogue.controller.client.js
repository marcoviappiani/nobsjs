'use strict';

angular.module('tropicalbs')
  .controller('AddTabDialogueController', AddTabDialogueController);

  AddTabDialogueController.$inject =  ['$mdDialog', 'tabsService'];

/**
 * Manages the view of the Tabs Admin view which displays a list of pages and an interface to perform operations on them
 */
function AddTabDialogueController ($mdDialog, tabsService) {
  var vm = this;
  vm.tab = {};
  vm.hide = hide;
  vm.cancel = cancel;
  vm.answer = answer;
  vm.save = save;


  //////////

  function hide () {
    $mdDialog.hide();
  }

  function cancel () {
    $mdDialog.cancel();
  }

  function answer (answ) {
    $mdDialog.hide(answ);
  }

  function save () {
    // TODO tabsService

  }

}
