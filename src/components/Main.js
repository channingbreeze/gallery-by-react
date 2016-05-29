require('normalize.css/normalize.css');
require('styles/App.scss');

import React from 'react';
import ReactDOM from 'react-dom';

// 获取图片相关的数据
let imageDatas = require('../data/imageDatas.json');

// 利用自执行函数，将图片名信息转成图片URL路径信息
imageDatas = (function genImageURL(imageDatasArr) {
  for( let i = 0, j = imageDatasArr.length; i < j; i++ ) {
    let singleImageData = imageDatasArr[i];
    singleImageData.imageURL = require('../images/' + singleImageData.fileName);
    imageDatasArr[i] = singleImageData;
  }
  return imageDatasArr;
})(imageDatas);

/*
 * 获取区间内的随记值
 */
function getRangeRandom(low, high) {
  return Math.round(Math.random() * (high - low) + low);
}

/*
 * 获取 0~30 之间的一个任意正负值
 */
function get30DegRandom() {
  return (Math.random() > 0.5 ? '' : '-') + Math.round(Math.random() * 30);
}

// 图片组件
class ImageFigure extends React.Component {

  constructor() {
    super();
  }

  /*
   * imgFigure的点击处理函数
   */
  handleClick(e) {

    if(this.props.arrange.isCenter) {
      this.props.inverse();
    } else {
      this.props.center();
    }

    e.stopPropagation();
    e.preventDefault();
  }

  render() {
    let styleObj = {};

    // 如果props属性中指定了这张图片的位置，则使用
    if(this.props.arrange.pos) {
      styleObj = this.props.arrange.pos;
    }

    // 如果图片的旋转角度有值并且不为0，添加旋转角度
    if(this.props.arrange.rotate) {
      ['Moz', 'ms', 'Webkit', ''].forEach(function(value) {
        styleObj[value + 'Transform'] = 'rotate(' + this.props.arrange.rotate + 'deg)';
      }.bind(this));
    }

    // 调整中心图片的zIndex
    if(this.props.arrange.isCenter) {
      styleObj.zIndex = 11;
    }

    let imgFigureClassName = 'img-figure';
    imgFigureClassName += this.props.arrange.isInverse ? ' is-inverse' : '';

    return (
      <figure className={imgFigureClassName} style={styleObj} onClick={this.handleClick.bind(this)}>
        <img src={this.props.data.imageURL}
             alt={this.props.data.title}/>
        <figcaption>
          <h2 className="img-title">{this.props.data.title}</h2>
          <div className="img-back" onClick={this.handleClick.bind(this)}>
            <p>
              {this.props.data.desc}
            </p>
          </div>
        </figcaption>
      </figure>
    )
  }
}

class AppComponent extends React.Component {

  constructor() {
    super();
    // getInitialState is invalid in es6, so we should call it manually
    this.state = this.getInitialState();
    this.Constants = {
      centerPos: {
        left: 0,
        right: 0
      },
      hPosRange: {  // 水平方向的取值范围
        leftSecX: [0, 0],
        rightSecX: [0, 0],
        y: [0, 0]
      },
      vPosRange: {  // 垂直方向的取值范围
        x: [0, 0],
        topY: [0, 0]
      }
    }
  }

  getInitialState() {
    return {
      imgsArrangeArr: []
    };
  }

  // 组件加载后，为每张图片计算其位置范围
  componentDidMount() {

    // 首先拿到舞台的大小
    let stageDOM = ReactDOM.findDOMNode(this.refs.stage),
        stageW = stageDOM.scrollWidth,
        stageH = stageDOM.scrollHeight,
        halfStageW = Math.round(stageW / 2),
        halfStageH = Math.round(stageH / 2);

    // 拿到一个imageFigure的大小
    let imgFigureDOM = ReactDOM.findDOMNode(this.refs.imgFigure0),
        imgW = imgFigureDOM.scrollWidth,
        imgH = imgFigureDOM.scrollHeight,
        halfImgW = Math.round(imgW / 2),
        halfImgH = Math.round(imgH / 2);

    // 计算中心图片的位置
    this.Constants.centerPos = {
      left: halfStageW - halfImgW,
      top: halfStageH - halfImgH
    }

    // 计算左侧，右侧区域图片排布位置的取值范围
    this.Constants.hPosRange.leftSecX[0] = -halfImgW;
    this.Constants.hPosRange.leftSecX[1] = halfStageW - halfImgW * 3;
    this.Constants.hPosRange.rightSecX[0] = halfStageW + halfImgW;
    this.Constants.hPosRange.rightSecX[1] = stageW - halfImgW;
    this.Constants.hPosRange.y[0] = -halfImgH;
    this.Constants.hPosRange.y[1] = stageH - halfImgH;

    // 计算上侧图片排布位置的取值范围
    this.Constants.vPosRange.topY[0] = -halfImgH;
    this.Constants.vPosRange.topY[1] = halfStageH - halfImgH * 3;
    this.Constants.vPosRange.x[0] = halfStageW - imgW;
    this.Constants.vPosRange.x[1] = halfStageW;

    this.reArrange(0);

  }

  /*
   * 翻转图片
   * @Param index 输入当前被执行inverse操作的图片对应的图片信息数组的index值
   * @return {Function} 这是一个闭包函数，其内return一个真正待被执行的函数
   */
  reverse(index) {
    return function() {
      let imgsArrangeArr = this.state.imgsArrangeArr;

      imgsArrangeArr[index].isInverse = !imgsArrangeArr[index].isInverse;

      this.setState({
        imgsArrangeArr: imgsArrangeArr
      });
    }.bind(this);
  }

  /*
   * 利用reArrange函数，居中对应的index的图片
   * @Param index, 需要被居中的图片对应的图片信息数组的index值
   * return {Function}
   */
  center(index) {
    return function () {
      this.reArrange(index);
    }.bind(this);
  }

  /*
   * 重新布局所有图片
   * @Param centerIndex 指定居中排布哪个图片
   */
  reArrange(centerIndex) {
    let imgsArrangeArr = this.state.imgsArrangeArr,
        Constants = this.Constants,
        centerPos = Constants.centerPos,
        hPosRange = Constants.hPosRange,
        vPosRange = Constants.vPosRange,
        hPosRangeLeftSecX = hPosRange.leftSecX,
        hPosRangeRightSecX = hPosRange.rightSecX,
        hPosRangeY = hPosRange.y,
        vPosRangeTopY = vPosRange.topY,
        vPosRangeX = vPosRange.x,
        
        imgsArrangeTopArr = [],
        topImgNum = Math.floor(Math.random() * 2),
        topImgSpliceIndex = 0,

        imgsArrangeCenterArr = imgsArrangeArr.splice(centerIndex, 1);

    // 首先居中 centerIndex 的图片,居中的 centerIndex 的图片不需要旋转
    imgsArrangeCenterArr[0] = {
      pos: centerPos,
      rotate: 0,
      isCenter: true
    };

    // 取出要布局上侧的图片的状态信息
    topImgSpliceIndex = Math.floor(Math.random() * (imgsArrangeArr.length - topImgNum));
    imgsArrangeTopArr = imgsArrangeArr.splice(topImgSpliceIndex, topImgNum);

    // 布局位于上侧的图片
    imgsArrangeTopArr.forEach(function(value, index) {
      imgsArrangeTopArr[index] = {
        pos: {
          top: getRangeRandom(vPosRangeTopY[0], vPosRangeTopY[1]),
          left: getRangeRandom(vPosRangeX[0], vPosRangeX[1])
        },
        rorate: get30DegRandom(),
        isCenter: false
      };
    });

    // 布局左右两侧的图片
    for (let i = 0, j = imgsArrangeArr.length, k = j / 2; i < j; i++) {
      let hPosRangeLORX = null;
      // 前半部分布局左边
      if(i < k) {
        hPosRangeLORX = hPosRangeLeftSecX;
      } else {
        hPosRangeLORX = hPosRangeRightSecX;
      }

      imgsArrangeArr[i] = {
        pos: {
          top: getRangeRandom(hPosRangeY[0], hPosRangeY[1]),
          left: getRangeRandom(hPosRangeLORX[0], hPosRangeLORX[1])
        },
        rotate: get30DegRandom(),
        isCenter: false
      };
    }

    if(imgsArrangeTopArr && imgsArrangeTopArr[0]) {
      imgsArrangeArr.splice(topImgSpliceIndex, 0, imgsArrangeTopArr[0]);
    }

    imgsArrangeArr.splice(centerIndex, 0, imgsArrangeCenterArr[0]);

    this.setState({
      imgsArrangeArr: imgsArrangeArr
    });

  }

  render() {

    let controllerUnits = [],
        imgFigures = [];

    // 图片组件数组
    imageDatas.forEach(function (value, index) {

      if(!this.state.imgsArrangeArr[index]) {
        this.state.imgsArrangeArr[index] = {
          pos: {
            left: 0,
            top: 0
          },
          rotate: 0,
          isInverse: false,
          isCenter: false
        };
      }

      imgFigures.push(<ImageFigure key={index} data={value} ref={'imgFigure' + index} arrange={this.state.imgsArrangeArr[index]} inverse={this.reverse(index)} center={this.center(index)}/>);

    }.bind(this));

    return (
      <section className="stage" ref="stage">
        <section className="img-sec">
          {imgFigures}
        </section>
        <nav className="controller-nav">
          {controllerUnits}
        </nav>
      </section>
    );
  }
}

AppComponent.defaultProps = {
};

export default AppComponent;
