/*
  Mock
  模拟请求 & 模拟数据
  作者：墨智

  参考资料：
  http://www.elijahmanor.com/2013/04/angry-birds-of-javascript-green-bird.html
  https://github.com/mennovanslooten/mockJSON
  https://github.com/appendto/jquery-mockjax
*/
KISSY.add("app/models/mock", function(S, Mock) {
  //-------------
  //模拟数据
  //-----------

  // 店铺用户分析
  Mock.mock(/api\/dpyhfx.json/, {
    data: {
      '店铺总用户数|1-100000000': 1,
      '新增活跃用户|1-100000000': 1,
      '沉默用户|1-100000000': 1,
      '数据变化趋势|1-10': [{
        '总用户数|1-10000': 1,
        '新增用户数|1-10000': 1,
        '流失用户数|1-10000': 1
      }],
      '用户首次来源|1-10': [{
        '分类|1': ['广告投放', '淘宝站内', '淘宝站外', '直接访问'],
        '数量|1-10000': 1,
        '百分比|1-100': 1
      }],
      '店铺人群地域分布|3': [{
        '分类|1': ['浙江', '上海', '北京', '江西', '江苏', '四川', '西藏', '新疆', '湖北', '湖南', '河南', '河北', '海南', '青岛'],
        '百分比|1-100': 1
      }],
      '用户性别|3': [{
        '分类|1': ['女性用户', '男性用户', '家庭用户', '未知用户'],
        '百分比|1-100': 1
      }],
      '职业分布|3': [{
        '分类|1': ['公务员', '白领', '学生', '家庭主妇', '其他'],
        '百分比|1-100': 1
      }],
      '年龄分布|3': [{
        '分类|1': ['18', '18-24', '25-29', '30-34', '35-49', '未知'],
        '百分比|1-100': 1
      }],
      '买家星级分布|3': [{
        '分类|+1': 1,
        '百分比|1-100': 1
      }],
      '长期兴趣便好|3': [{
        '分类|+1': 1,
        '百分比|1-100': 1
      }],
      '淘宝月均消费|3': [{
        '分类|+1': 1,
        '百分比|1-100': 1
      }],
      '30天内店铺消费总金额|3': [{
        '分类|+1': 1,
        '百分比|1-100': 1
      }]
    },
    info: {
      "ok": true,
      "message": "@MALE_FIRST_NAME @LAST_NAME"
    }
  });
  // 全景用户分析
  // 渠道分析
  // 渠道
  // 报表
  // 结算

  //首页
  Mock.mock(/api\/home.json/, {
    data: {
      "count|1-10": 1,
      "list|5-10": [{
        "name|1-10": "@MALE_FIRST_NAME @LAST_NAME",
        "status|0-3": 0,
        "updateTime": "2012-12-12",
        "beginTime": "2012-04-04",
        "endTime": "2012-04-10",
        "auditComments": null,
        "id|+1": 10000,

        "created_date": "@DATE_YYYY/@DATE_MM/@DATE_DD",
        "created_time": "@TIME_HH:@TIME_MM:@TIME_SS",
        "title|2-4": "@LOREM ",
        "description": "@LOREM_IPSUM"

      }]
    },
    info: {
      "ok": true,
      "message": "@MALE_FIRST_NAME @LAST_NAME"
    }
  });

  //获取计划
  Mock.mock(/api\/getPlan.json/, {
    data: {
      plan: {
        "id|1000-9999": 1000,
        "name": "@MALE_FIRST_NAME @LAST_NAME",
        "type|1-3": 1,
        "zone": "b"
      }
    },
    info: {
      "ok|0-1": true,
      "message": "获取计划信息失败"
    }
  });

  //创建计划
  Mock.mock(/api\/create.json/, {
    data: null,
    info: {
      "ok|0-1": true,
      "message": "创建计划失败"
    }
  });

  //其他的接口
  // Mock.mock(/.+.json/, {
  //   "data|5-10": [{
  //     "married|0-1": true,
  //     "name": "@MALE_FIRST_NAME @LAST_NAME",
  //     "sons": null,
  //     'daughters|0-3': [{
  //       "age|0-31": 0,
  //       "name": "@FEMALE_FIRST_NAME"
  //     }]
  //   }],
  //   info: {
  //     "ok|0-1": true,
  //     "message": "@MALE_FIRST_NAME @LAST_NAME"
  //   }
  // });

  return Mock;
}, {
  requires: ['components/mock/index']
});