/**
 * Created by 马志娟 on 2017/07/21 0021.
 */

/**
 * @module MyChart
 */

/* 实现的问题
 * 画出区域坐标轴
 * 动态设置坐标刻度x,y
 * 显示文字
 *
 * 需要用到的属性：
 * canvas 的宽度，高度
 * 坐标位置x,y
 * 坐标颜色
 * 线条颜色
 * 线条的zrender实例
 *
 * 方法：
 * 划线
 * 生成刻度
 */

function MyChart(id,opts) {
    this.id=id;
    this.type=opts.series[0].type;
    this.x_value=opts.xAxis[0].data;//存放 X 坐标
    this.y_value=opts.series[0].data;//存放 Y 坐标


}
var myChartProto = MyChart.prototype;

/**计算 y 轴实际坐标间距
 * @param height
 * @returns {number}
 */
myChartProto.axisYScale=function() {
    let data_big;//存放y轴最大数据 183
    let y_scale;//存放y轴坐标间距30

    data_big=this.dataBig();  //获取最大数据，并向上四舍五入
    y_scale=data_big/7;
    y_scale=Math.ceil(y_scale/10)*10;
    return y_scale;
}

//返回图表实际高度
myChartProto.chartHeight=function (num) {
    let chart_height=num-40;//为 X 轴坐标留40px
    return chart_height;
}

//返回画布上的坐标间距
myChartProto.canvasScale=function(canvas_height,num) {
    let chart_height=this.chartHeight(canvas_height);
    let canvas_scale=parseInt(chart_height/7);
    return canvas_scale;
}

//返回数据落在画布上的位置
myChartProto.dataPosition=function (canvas_height,num) {
    let canvas_scale=this.canvasScale(canvas_height);
    let y_axis=this.axisYScale();
    let scale=y_axis/canvas_scale;
    return num/scale;
}


/**存放最大数据
 *
 * @returns {number}
 */
myChartProto.dataBig=function() {
    return Math.ceil(this.sortData(this.y_value));
}

/**数据排序，找出最大值
 * @param data
 * @returns {*}
 */
myChartProto.sortData=function (data) {;
    let num=data.slice(0);//copy数组，防止排序后影响原数组。
    num.sort(function (a,b) {//对新数组排序
        return b-a;
    })
    return num[0];
}

/**绘制图标
 *
 */
myChartProto.loadZrender=function () {
    var _this=this;
    require.config({
        packages: [
            {
                name: 'zrender',
                location: 'src',
                main: 'zrender'
            }
        ]
    });
    require(
        [
            'zrender',
            'zrender/graphic/Text',
            'zrender/graphic/shape/Rect',
            'zrender/graphic/shape/Circle',
            'zrender/graphic/shape/Line',
            'zrender/graphic/shape/Polyline',
            'zrender/graphic/shape/Droplet',
            'zrender/svg/svg'
        ],
        function (zrender, Text, RectShape, Circle, Line, Polyline,Droplet) {
            // 初始化zrender
            var zr = zrender.init(document.getElementById(_this.id), {
                renderer: 'svg'
            });

            /**绘制文本
             * @param x
             * @param y
             * @param text
             */
            function drawText(x,y,text) {
                zr.add(new Text({
                    style: {
                        x: x,
                        y: y,
                        text: text,
                        textFill: 'rgba(0, 0, 0, 1)',
                        textFont: '12px Microsoft Yahei'
                    },
                    position : [0, 20]
                }));
            }

            //绘制圆点
            function drawDot(x,y,r) {
                let c = new Circle({
                    shape: {
                        cx: x,
                        cy: y,
                        r:r
                    },
                    style: {
                        fill: '#666',
                    },
                    position : [30, 20],
                    onmouseover: function () {
                        this.animateShape()
                            .when(200, {
                                r: 6
                            })
                            .start();
                    },
                    onmouseout: function () {
                        this.animateShape()
                            .when(200, {
                                r: 3
                            })
                            .start();
                    }
                });
                zr.add(c);

            }

            //绘制直线
            drawCoordinate =function () {
                /**绘制坐标线
                 * @param x1
                 * @param y1
                 * @param x2
                 * @param y2
                 * @param stroke_style
                 */
                function drawLine(x1,y1,x2,y2,stroke_style) {
                    let lineX = new Line({
                        shape: {
                            x1: x1,
                            y1: y1,
                            x2: x2,
                            y2: y2
                        },
                        style: {
                            stroke:stroke_style,
                            fill: null
                        },
                        position : [0, 20]
                    });
                    zr.add(lineX);
                }


                for(let i=0;i<7;i++){
                    drawLine(25,_this.canvasScale(zr.getHeight())*i,zr.getWidth(),_this.canvasScale(zr.getHeight())*i,'rgba(0, 0, 0, 0.5)');//绘制横向参考线
                    drawLine(25,_this.canvasScale(zr.getHeight())*i,30,_this.canvasScale(zr.getHeight())*i,'rgba(0, 0, 0, 1)');//绘制 Y 轴坐标线
                    drawText(0,_this.canvasScale(zr.getHeight())*i,_this.axisYScale()*(7-i));//绘制 Y 轴坐标
                }

                drawLine(20,_this.chartHeight(zr.getHeight()),zr.getWidth(),_this.chartHeight(zr.getHeight()),'rgba(0, 0, 0, 1)');//绘制 X 轴
                drawText(0,_this.chartHeight(zr.getHeight()),0);//绘制 原点0 坐标
                drawLine(30,0,30,_this.chartHeight(zr.getHeight()),'rgba(0, 0, 0, 1)');//绘制 Y 轴
                let len=(_this.x_value).length;//获取x轴最大坐标

                let getType=_this.type;//获取图标种类

                for(let i=0;i<len;i++){
                    let x=parseInt(((zr.getWidth()-20)/_this.x_value.length))*i;
                    drawLine(x+30,_this.chartHeight(zr.getHeight()),x+30,_this.chartHeight(zr.getHeight())+5,'rgba(0, 0, 0, 1)');//绘制 X 轴坐标线

                    switch (getType){
                        case "Polyline":
                            drawText(x+20,_this.chartHeight(zr.getHeight())+10,_this.x_value[i]);//绘制 X 轴坐标
                            break;
                        case "RectShape":
                            drawText(x+38,_this.chartHeight(zr.getHeight())+10,_this.x_value[i]);//绘制 X 轴坐标
                            break;
                    }

                }
            }
            drawCoordinate();

            /**动态数据
             * @returns {Array}
             */
            function joinData() {
                var svg_width=parseInt((zr.getWidth()-20)/_this.x_value.length);
                var arr=[];
                for(var i=0;l=_this.x_value.length,i<l;i++){
                    arr[i]=[svg_width*i,_this.chartHeight(zr.getHeight())-_this.dataPosition(zr.getHeight(),_this.y_value[i])];
                }
                return arr;
            }

            //判断加载图表类型
            (function ( ){
                var getType=_this.type;//获取图标种类
                switch (getType){
                    case "Polyline":
                        lineChart();
                        break;
                    case "RectShape":
                        barChart();
                        break;
                }
            })( );

            //折线图
            function lineChart() {
                var polyline = new Polyline({
                    //data:[[0,2.6], [55,5.9], ...,[660, 2.3]]
                    shape: {
                        points: joinData()
                    },
                    position : [30, 20]
                });
                zr.add(polyline);

                for(let i=0;i<_this.x_value.length;i++){
                    let x= parseInt((zr.getWidth()-20)/_this.x_value.length)*i;
                    let y=_this.chartHeight(zr.getHeight())-_this.dataPosition(zr.getHeight(),_this.y_value[i]);
                    drawDot(x,y,3);
                    drawText(x+20,y-16,_this.y_value[i]);
                }
            }

            //条形图
            function barChart() {
                let N = _this.x_value.length;
                for (var i = 0; i < N; i++) {
                    var barShape = new RectShape({
                        shape: {
                             x: i * (zr.getWidth()-30)/N+10,
                             y: _this.chartHeight(zr.getHeight()),
                             width: ((zr.getWidth()-30) / N-20),
                             height: 0
                        },
                         style: {
                             fill: 'rgb(0, 0, 180)',
                             color : 'rgba(135, 206, 250, 0.8)',
                             //text:_this.y_value[i],
                             //textPositionRect:'inside'
                         },
                         position : [30, 20],

                         onmouseover: function () {
                             this.animateStyle()
                             .when(200, {
                                fill: 'rgb(180, 0, 0)'
                             })
                             .start();
                         },
                         onmouseout: function () {
                             this.animateStyle()
                             .when(200, {
                                fill: 'rgb(0, 0, 180)'
                             })
                             .start();
                         }
                    });
                    zr.add(barShape);

                    barShape.animateTo({
                         shape: {
                             height: _this.dataPosition(zr.getHeight(),_this.y_value[i]),
                             //_this.chartHeight(zr.getHeight())-_this.dataPosition(zr.getHeight(),_this.y_value[i])
                             y:_this.chartHeight(zr.getHeight())-_this.dataPosition(zr.getHeight(),_this.y_value[i])
                         }
                    }, 500);

                    drawText(i * (zr.getWidth()-30)/N+40,_this.chartHeight(zr.getHeight())-_this.dataPosition(zr.getHeight(),_this.y_value[i])-15,_this.y_value[i]);
                }
            }

        }
    );
}
