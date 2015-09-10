'use strict';

angular.module('tropicalbs')
  .controller('AdminTabsController', AdminTabsController);

  AdminTabsController.$inject =  ['tabsService', '$mdDialog'];

/**
 * Manages the view of the Tabs Admin view which displays a list of pages and an interface to perform operations on them
 */
function AdminTabsController (tabsService, $mdDialog) {
  var vm = this;
  vm.tabs = [];
  vm.readonly = true;
  vm.createTabDialogue = createTabDialogue;
  vm.editTabDialogue = editTabDialogue;

  activate();

  //////////

  /**
   * Queries the database to get all Tabs
   */
  function activate () {
    //do stuff
    tabsService.getAllTabs()
      .then(setAllTabs);
  }

  //create a tab
  // function createTab () {
  //   tabsService.createTab()
  //     .then(setAllTabs);
  // }


  // function editTab () {
  //   //edit a tab
  // }

  // function removeTab () {
  //   //remove a tab
  // }

  function setAllTabs (res) {
    vm.tabs = res;
  }

  function createTabDialogue (ev, tab) {
    $mdDialog.show({
      controller: 'AddTabDialogueController',
      controllerAs: 'vm',
      templateUrl: '../../../../modules/core/client/views/adminTabsDialogue.view.client.html',
      parent: angular.element(document.body),
      targetEvent: ev,
      clickOutsideToClose: true
    })
    .then(function(answer) {
      //success
      console.log('success');
    }, function() {
      //cancel
      console.log('cancelled');
    });
  }

  function editTabDialogue (ev, tab) {
    $mdDialog.show({
      controller: 'EditTabDialogueController',
      controllerAs: 'vm',
      templateUrl: '../../../../modules/core/client/views/adminTabsDialogue.view.client.html',
      parent: angular.element(document.body),
      locals: {
             tab: tab,
           },
      targetEvent: ev,
      clickOutsideToClose: true
    })
    .then(function(answer) {
      //success
      console.log('success');
    }, function() {
      //cancel
      console.log('cancelled');
    });
  }

}
