KISSY.config({
  packages: [{
    name: 'mock',
    path: '../'
  }]
});

module('mock');

test('mock data', function() {
  stop();
  KISSY.use(['mock/mock'], function(S, Mock) {
    var template = {
      "data|5-10": [{
        "married|0-1": true,
        "name": "@MALE_FIRST_NAME @LAST_NAME",
        "sons": null,
        'daughters|0-3': [{
          "age|0-31": 0,
          "name": "@FEMALE_FIRST_NAME"
        }]
      }],
      info: {
        "oK|0-1": true,
        "message": "@MALE_FIRST_NAME @LAST_NAME"
      }
    };
    Mock.mockJSON(/.+.json/, template);

    var data = Mock.mockJSON.generateFromTemplate(template);
    ok(data.data.length > 0, 'data ok');

    debugger
    start();
  }) // use
})

test('mock ajax', function() {
  debugger
  stop();
  KISSY.use(['mock/mock'], function(S, Mock) {
    KISSY.io({
      url: 'test.json',
      success: function(data, textStatus, xhrObj) {
        ok(true, 'mock ajax success.');
        console.log('[success]', data);
      },
      error: function(textStatus, xhrObj) {
        ok(false, 'mock ajax fail.');
      },
      complete: function() {
        start();
      }
    }) // io
  }) // use
});