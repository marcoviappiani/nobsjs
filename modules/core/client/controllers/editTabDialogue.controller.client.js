'use strict';

angular.module('tropicalbs')
  .controller('EditTabDialogueController', EditTabDialogueController);

  EditTabDialogueController.$inject =  ['$mdDialog', 'tab'];

/**
 * Manages the view of the Tabs Admin view which displays a list of pages and an interface to perform operations on them
 */
function EditTabDialogueController ($mdDialog, tab) {
  var vm = this;
  vm.tab = {};
  vm.hide = hide;
  vm.cancel = cancel;
  vm.answer = answer;

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
}
