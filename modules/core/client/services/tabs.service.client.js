'use strict';

angular.module('tropicalbs')
  .factory('tabsService', tabsService);

tabsService.$inject = ['$http'];

function tabsService ($http) {
  var tabs = {
    createTab: createTab,
    getAllTabs: getAllTabs
  };

  return tabs;

  //////////


  function createTab (tab) {
    var req = {
      method: 'POST',
      url: '/api/core/tabs',
      data: tab
    };

    return $http(req)
      .then(returnData);
  }

  function getAllTabs () {
    var req = {
      method: 'GET',
      url: '/api/core/tabs'
    };

    return $http(req)
      .then(returnData);
      // no catch block allows the controller to receive the error and provide feedback to the user
  }

  function returnData (res) {
    return res.data;
  }




}
