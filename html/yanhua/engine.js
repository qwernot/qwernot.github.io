
//====================
//连连看引擎
//====================
var Engine = function (bg) {
    //游戏级别
    this.LevelCount = 7;

    //项大小
    this.ItemSize = new Point(36, 36);
    //整个画布大小
    this.BackGroundSize = new Point(700, 500);

    //配置信息
    this.Config = new LLHConfig();

    //操作区域大小
    this.ItemAreaPer = 0.6;

    //已经选取成功的点个数
    this.SelectedCount = 0;

    this.FPS = 100;

    /// *************
    /// 画布格子的最大行列数
    /// *************
    this.MaxBackGridSplits = new Point(12, 8);
    //当前选中的点        
    this.CurSelectedItem = null;
    //当前级别的格子数
    this.ItemCount = 0;

    /// **********
    /// 当前级别
    /// **********
    this.CurLevelIndex = 1;
    //游戏显示区域
    this.GameBody = bg;
    /// **********
    /// /游戏背景画布
    /// **********
    this.GameBackGrid = null;
    //背景图
    this.BackGroundImg = null;
    //项容器Canvas
    this.BackItemContainer = null;
    //2d Context
    this.Context = null;
    //音频播放器
    this.Audio = null;

    //当前级别对象
    this.CurLevel = null;
    //得分显示区域
    this.ScroeArea = null;
    //当前级别区域
    this.LevelArea = null;

    /// **********
    /// 所有的方块
    /// **********
    this.AllItems = new Array();

    //初始化
    this.InitEngine();
    this.SetLevel(1);

}

//设置级别
Engine.prototype.SetLevel = function (level) {
    if (level > this.LevelCount)//如果级别大于总级数.则完成游戏
    {
        alert('游戏完成,继续请重新刷新页面!');
        return;
    }
    var leveltmp = new GameLevel(level + 1); //预加载下级的资源
    var totalscore = this.CurLevel ? this.CurLevel.Score : 0; //原得分
    this.CurLevelIndex = level;
    this.CurLevel = new GameLevel(level);
    this.CurLevel.Score = totalscore; //得分不变
    var bgindex = Math.floor(Math.random() * this.Config.ImageUris.length)
    this.BackGroundImg.src = this.Config.ImageUris[bgindex];
    this.LevelArea.innerHTML = '等级:' + this.CurLevel.Level;
    this.InitImg(); //重置图片
    //this.RefreshGreen();

    if (this.Audio) {
        this.GameBackGrid.removeChild(this.Audio);
    }
    //音频播放器    
    this.Audio = document.createElement('audio');    
    if (this.Audio) {
        var srcindex = Math.floor(Math.random() * this.Config.MusicUris.length)
        this.Audio.src = this.Config.MusicUris[srcindex];
        this.Audio.autoplay = 'autoplay';
        this.Audio.loop = 'loop';
        this.GameBackGrid.appendChild(this.Audio);
    }    
}

//单击小方块
Engine.prototype.ClickItem = function (evt) {
    var clickx = evt.layerX ? evt.layerX : evt.offsetX;
    var clicky = evt.layerY ? evt.layerY : evt.offsetY; ;
    //获取点击的项
    var item = this.GetItemByXY(clickx, clicky);
    if (!item || !item.Visibled) return;
    //如果当前未选择。。则选选此方块
    if (!this.CurSelectedItem) {
        this.CurSelectedItem = item;
        item.Select(true);
        //this.RefreshItem(item);
    }
    else {
        //如果二点可连
        //隐藏二点
        if (this.IsCanLink(this.CurSelectedItem, item)) {
            this.CurSelectedItem.Hide();
            item.Hide();
            //this.RefreshItem(this.CurSelectedItem);
            //this.RefreshItem(item);
            this.CurSelectedItem = null;
            this.CurLevel.Score += this.CurLevel.BaseImgCount//增加得分
            this.ScroeArea.innerHTML = '得分:' + this.CurLevel.Score;
            var items = this.GetInlineItems(); //获取还没有被隐藏的点
            if (items.length == 0) { //全部连通
                this.SetLevel(this.CurLevel.Level + 1); //下一级
            }
        }
        else {
            this.CurSelectedItem.Select(false);
            this.RefreshItem(this.CurSelectedItem);
            this.CurSelectedItem = item;
            item.Select(true);
            //this.RefreshItem(item);
        }
    }
    //this.RefreshGreen();//刷新屏幕
}
//通过地址获取小方块对象
Engine.prototype.GetItemByXY = function (x, y) {
    for (var i = 0; i < this.AllItems.length; i++) {
        if (this.AllItems[i].Location.X <= x && this.AllItems[i].Location.Y <= y)
            if (x - this.AllItems[i].Location.X < this.AllItems[i].Width && y - this.AllItems[i].Location.Y < this.AllItems[i].Height)
                return this.AllItems[i];
    }
}
//重置图片
Engine.prototype.InitImg = function () {
    var itemsrcs = new Array();
    //随机获取图片
    for (var i = 0; i < this.MaxBackGridSplits.Y / 2; i++) {
        for (var j = 0; j < this.MaxBackGridSplits.X; j++) {
            //随机取图片
            var rndindex = Math.floor(Math.random() * this.CurLevel.BaseImgCount);
            itemsrcs.push(this.CurLevel.ItemImages[rndindex].src);
            itemsrcs.push(this.CurLevel.ItemImages[rndindex].src);
        }
    }
    var srcIndex = itemsrcs.length;
    for (var i = 0; i < this.AllItems.length; i++) {
        var item = this.AllItems[i];
        //随机取图片
        var rndindex = Math.floor(Math.random() * srcIndex);
        srcIndex--;
        var tmpsrc = itemsrcs[rndindex];
        itemsrcs[rndindex] = itemsrcs[srcIndex];
        item.Src = item.ImgElement.src = tmpsrc;
        item.Select(false);
        item.Show(); // 显示
    }
}

//初始化格子InitGrid
Engine.prototype.InitGrid = function () {
    //小图片宽
    var itemw = this.BackGroundSize.X * this.ItemAreaPer / this.MaxBackGridSplits.X;
    //小图片高
    var itemh = this.BackGroundSize.Y * this.ItemAreaPer / this.MaxBackGridSplits.Y;

    //初始化行列    
    for (var i = 0; i < this.MaxBackGridSplits.Y; i++) {
        for (var j = 0; j < this.MaxBackGridSplits.X; j++) {
            var item = new ImgItem('item_' + i + '_' + j, this.Context, new Point(j, i), '', itemw, itemh);            
            this.AllItems.push(item);
        }
    }
}
//刷新单个项
Engine.prototype.RefreshItem = function (item) {
    this.Context.clearRect(item.Location.X, item.Location.Y, item.Width, item.Height);
    if (item.Visibled) {
        this.Context.drawImage(item.ImgElement, item.Location.X, item.Location.Y, item.Width, item.Height);
        if (item.Selected) { //如果被选择
            this.Context.strokeStyle = '#f00'; // red
            this.Context.lineWidth = 2;
            this.Context.strokeRect(item.Location.X, item.Location.Y, item.Width -2 , item.Height-2 );
        }
    }   
}
//刷新整个画板
Engine.prototype.RefreshGreen = function () {
    if (!this.Context) return;
    this.Context.clearRect(0, 0, this.BackItemContainer.width, this.BackItemContainer.height);
    var len = this.AllItems.length;
    for (var i = 0; i < len; i++) {
        var item = this.AllItems[i];
        //仅画出可显示的部分
        if (item.Visibled) {
            // this.Context.drawImage(item.ImgElement, item.Location.X, item.Location.Y, item.Width, item.Height);
            this.RefreshItem(item);
        }
    }
}
//生成画布
Engine.prototype.CreateCanvas = function () {
    this.BackItemContainer = document.createElement('Canvas');
    this.BackItemContainer.setAttribute('width', this.BackGroundSize.X * this.ItemAreaPer);
    this.BackItemContainer.setAttribute('height', this.BackGroundSize.Y * this.ItemAreaPer);
    var padper = (1 - this.ItemAreaPer) / 2;
    this.BackItemContainer.setAttribute('style', 'border: 1px solid green;position: absolute;left:' + (padper * 100) + '%;top:' + (padper * 100) + '%;color:red;font-weight:600;');
    this.BackItemContainer.setAttribute('onclick', 'javascript:window.llhengine.ClickItem(event);');
    this.BackItemContainer.innerHTML = "您的浏览器不支持Html5,无法进行游戏";
    this.GameBackGrid.appendChild(this.BackItemContainer);
    if (this.BackItemContainer && this.BackItemContainer.getContext) this.Context = this.BackItemContainer.getContext('2d');
}
//初始化
Engine.prototype.InitEngine = function () {
    if (!this.GameBackGrid) {
        this.GameBackGrid = document.createElement('div');
        this.GameBackGrid.setAttribute("style", 'width: ' + this.BackGroundSize.X + 'px; height: ' + this.BackGroundSize.Y +
         'px; position: relative;text-align: center; vertical-align: middle;')
        if (!this.GameBody) window.document.body.appendChild(this.GameBackGrid);
        else this.GameBody.appendChild(this.GameBackGrid);
    }

    clearChildren(this.GameBackGrid); //重置画布
    //生成背景图
    if (!this.BackGroundImg) {
        this.BackGroundImg = document.createElement('img');
        this.BackGroundImg.setAttribute('width', '100%');
        this.BackGroundImg.setAttribute('height', '100%');
        this.GameBackGrid.appendChild(this.BackGroundImg);
    }
    //项容器canvas
    if (!this.BackItemContainer) {
        this.CreateCanvas(); //生成画布
        if (this.Context) {
            this.InitGrid(); //初始化格子
        }
    }
    
    //计分牌
    if (!this.ScroeArea) {
        this.ScroeArea = document.createElement('span');
        this.ScroeArea.setAttribute('width', '40px');
        this.ScroeArea.setAttribute('style', 'border: 1px solid red;position: absolute;left:0px;top:0px;height:22px;width:80px;color:blue; font-weight:600;background-color:Gray;');
        this.GameBackGrid.appendChild(this.ScroeArea);
    }
    //计分牌
    if (!this.LevelArea) {
        this.LevelArea = document.createElement('span');
        this.LevelArea.setAttribute('width', '40px');
        this.LevelArea.setAttribute('style', 'border: 1px solid red;position: absolute;left:' + (this.BackGroundSize.X - 80) + 'px;top:0px;height:22px;width:80px;color:blue; font-weight:600;background-color:Gray;');
        this.GameBackGrid.appendChild(this.LevelArea);
    }
}
//获取还没有隐藏的项
Engine.prototype.GetInlineItems = function () {
    var items = new Array();
    for (var i = 0; i < this.AllItems.length; i++) {
        if (this.AllItems[i].Visible()) {
            items.push(this.AllItems[i]);
        }
    }
    return items;
}

//==========================
//引擎核心代码
//二点连接逻辑
//==========================

//重新排列当前方块
Engine.prototype.RefreshGrid = function () {
    var items = this.GetInlineItems();
    if (items.length > 0) {
        var len = items.length;
        for (var i = len - 1; i >= 0; i--) {
            var rndindex = Math.floor(Math.random() * (i + 1));
            var tmpsrc = items[i].Src;
            items[i].Src=items[i].ImgElement.src = items[rndindex].Src;
            items[rndindex].Src=items[rndindex].ImgElement.src = tmpsrc
        }
    }
    this.RefreshGreen();
}

/// 判断二点的方位      
Engine.prototype.GetItemDer=function(item1, item2)
{
    if (item1.Position.X == item2.Position.X)
    {
        return ItemDer.LineY;
    }
    if (item2.Position.Y == item1.Position.Y)
    {
        return ItemDer.LineX;
    }

    if ((item1.Position.X - item2.Position.X) * (item1.Position.Y - item2.Position.Y) > 0)
    {
        return ItemDer.LTRB;
    }
    else
        return ItemDer.LBRT;
}


/// 检查查此位置是否为空      
Engine.prototype.CheckPointIsEmpty=function(x,y)
{
    for (var i = 0; i < this.AllItems.length; i++) {
        if (this.AllItems[i].Position.X == x && this.AllItems[i].Position.Y==y) {
           return !this.AllItems[i].Visible();
        }
    }
    return true;
}

/// 判断二点之间是否都为空
Engine.prototype.CheckInPointsIsEmpty=function(p1, p2,iDer)
{
    //如果二点为X轴方向
    if (iDer == ItemDer.LineX)
    {
        //如果二点在一起
        if (Math.abs(p1.X - p2.X) == 1 || (p1.X - p2.X) == 0)
        {
            return true;
        }

        //得到二点的X轴偏移量
        var offsetx = p1.X - p2.X;
        //p1在p2的左边
        if (offsetx < 0)
        {
            for (var i = 1; i < Math.abs(offsetx); i++)
            {
                //如果二点之间有不为空的点
                if (!this.CheckPointIsEmpty(p1.X + i, p1.Y))
                {
                    return false;
                }
            }
            return true;
        }
        else//1在2的右边
        {
            for (var i = 1; i < Math.abs(offsetx); i++)
            {
                //如果二点之间有不为空的点
                if (!this.CheckPointIsEmpty(p2.X + i, p1.Y))
                {
                    return false;
                }
            }
            return true;
        }
    }
    else if (iDer == ItemDer.LineY) //如果为Y轴方向
    {
        //如果二点在一起
        if (Math.abs(p1.Y - p2.Y) == 1 || p1.Y - p2.Y == 0)
        {
            return true;
        }

        //得到二点的Y轴偏移量
        var offsety = p1.Y - p2.Y;
        //p1在p2的上边
        if (offsety < 0)
        {
            for (var i = 1; i < Math.abs(offsety); i++)
            {
                //如果二点之间有不为空的点
                if (!this.CheckPointIsEmpty(p1.X,p1.Y + i))
                {
                    return false;
                }
            }
            return true;
        }
        else//1在2的下边
        {
            for (var i = 1; i < Math.abs(offsety); i++)
            {
                //如果二点之间有不为空的点
                if (!this.CheckPointIsEmpty(p2.X,p2.Y + i))
                {
                    return false;
                }
            }
            return true;
        }
    }

    return false;
}


/// 判断左下右上的二点
Engine.prototype.CheckLBRT=function(item1, item2)
{
    //如果item1在右边
    //就对换，保持item1在左边
    if (item1.Position.X > item2.Position.X)
    {
        var itemtmp = item1;
        item1 = item2;
        item2 = itemtmp;
    }

    //首先向左检查查
    //因为item2的X值大，所以从item2开始向左延伸
    for (var i = item2.Position.X - 1; i >= 0; i--)
    {
        var p1 = new Point(i, item2.Position.Y);
        var p2 = new Point(i, item1.Position.Y);
        //如果左点不为空。则此方向不可行
        if (!this.CheckPointIsEmpty(p1.X,p1.Y))
        {
            break;
        }
        //如果左点下方与item1水平的点不为空，则此线不行。进行下一个
        if (p2.X != item1.Position.X && p2.Y != item1.Position.Y && !this.CheckPointIsEmpty(p2.X,p2.Y))
        {
            //如果i已经到item1的左边了，则此方向不可以再连通了
            if (i < item1.Position.X)
            {
                break;
            }
            continue;

        }
        //如果p2与item1之间的连线为空且p1与p2之间的连线为空
        //则这二点可以连线
        if (this.CheckInPointsIsEmpty(p2, item1.Position, ItemDer.LineX) && this.CheckInPointsIsEmpty(p1, p2, ItemDer.LineY))
        {
            return true;
        }
        else if (i == 0)//如果虽然这二边连不通。但这二点已是最边点了。说明可连
        {
            return true;
        }
    }

    //向右检查查
    //因为item1的X值小，所以从item1开始向右延伸
    for (var i = item1.Position.X + 1; i < this.MaxBackGridSplits.X; i++)
    {
        var p1 = new Point(i, item1.Position.Y);
        var p2 = new Point(i, item2.Position.Y);
        //如果右点不为空。则此方向不可行
        if (!this.CheckPointIsEmpty(p1.X,p1.Y))
        {
            break;
        }
        //如果右点下方与item2水平的点不为空，则此线不行。进行下一个
        if (p2.X != item2.Position.X && p2.Y != item2.Position.Y && !this.CheckPointIsEmpty(p2.X,p2.Y))
        {
            //如果i已经到item2的右边了，则此方向不可以再连通了
            if (i > item2.Position.X)
            {
                break;
            }
            continue;
        }
        //如果p2与item2之间的连线为空且p1与p2之间的连线为空
        //则这二点可以连线
        if (this.CheckInPointsIsEmpty(p2, item2.Position, ItemDer.LineX) && this.CheckInPointsIsEmpty(p1, p2, ItemDer.LineY))
        {
            return true;
        }
        //如果虽然这二边连不通。但这二点已是最边点了。说明可连
        else if (i == this.MaxBackGridSplits.X - 1)
        {
            return true;
        }
    }

    //向上检查查
    //因为item１的Y值大，所以从item2开始向上延伸
    for (var i = item1.Position.Y - 1; i >= 0; i--)
    {
        var p1 = new Point(item1.Position.X, i);
        var p2 = new Point(item2.Position.X, i);
        //如果上点不为空。则此方向不可行
        if (!this.CheckPointIsEmpty(p1.X,p1.Y))
        {
            break;
        }
        //如果上点左方与item2垂直的点不为空，则此线不行。进行下一个
        if (p2.X != item2.Position.X && p2.Y != item2.Position.Y && !this.CheckPointIsEmpty(p2.X,p2.Y))
        {
            //如果i已经到item2的上边了，则此方向不可以再连通了
            if (i < item2.Position.Y)
            {
                break;
            }
            continue;
        }
        //如果p2与item2之间的连线为空且p1与p2之间的连线为空
        //则这二点可以连线
        if (this.CheckInPointsIsEmpty(p2, item2.Position, ItemDer.LineY) && this.CheckInPointsIsEmpty(p1, p2, ItemDer.LineX))
        {
            return true;
        }
        else if (i == 0)//如果虽然这二边连不通。但这二点已是最边点了。说明可连
        {
            return true;
        }
    }

    //向下检查查
    //因为item2的Y值小，所以从item2开始向下延伸
    for (var i = item2.Position.Y + 1; i < this.MaxBackGridSplits.Y; i++)
    {
        var p1 = new Point(item2.Position.X, i);
        var p2 = new Point(item1.Position.X, i);

        //如果下点不为空。则此方向不可行
        if (!this.CheckPointIsEmpty(p1.X,p1.Y))
        {
            break;
        }
        //如果下点下方与item1垂直的点不为空，则此线不行。进行下一个
        if (p2.X != item1.Position.X && p2.Y != item1.Position.Y && !this.CheckPointIsEmpty(p2.X, p2.Y))
        {
            //如果i已经到item2的下边了，则此方向不可以再连通了
            if (i > item1.Position.Y)
            {
                break;
            }
            continue;
        }
        //如果p2与item1之间的连线为空且p1与p2之间的连线为空
        //则这二点可以连线
        if (this.CheckInPointsIsEmpty(p2, item1.Position, ItemDer.LineY) && this.CheckInPointsIsEmpty(p1, p2, ItemDer.LineX))
        {
            return true;
        }
        //如果虽然这二边连不通。但这二点已是最边点了。说明可连
        else if (i == this.MaxBackGridSplits.Y - 1)
        {
            return true;
        }
    }

    return false;
}


/// 判断左上右下的二点
Engine.prototype.CheckLTRB=function(item1,item2)
{
    //如果item1在右边
    //就对换，保持item1在左边
    if (item1.Position.X > item2.Position.X)
    {
        var itemtmp = item1;
        item1 = item2;
        item2 = itemtmp;
    }

    //首先向左检查查
    //因为item2的X值大，所以从item2开始向左延伸
    for (var i = item2.Position.X - 1; i >= 0; i--)
    {
        var p1 = new Point(i, item2.Position.Y);
        var p2 = new Point(i, item1.Position.Y);
        //如果左点不为空。则此方向不可行
        if (!this.CheckPointIsEmpty(p1.X,p2.Y))
        {
            break;
        }
        //如果左点上方与item1水平的点不为空，则此线不行。进行下一个
        if (p2.X != item1.Position.X && p2.Y != item1.Position.Y && !this.CheckPointIsEmpty(p2.xp2.Y))
        {
            //如果i已经到item1的左边了，则此方向不可以再连通了
            if (i < item1.Position.X)
            {
                break;
            }                        
            continue;                    
                    
        }
        //如果p2与item1之间的连线为空且p1与p2之间的连线为空
        //则这二点可以连线
        if (this.CheckInPointsIsEmpty(p2, item1.Position, ItemDer.LineX) && this.CheckInPointsIsEmpty(p1, p2, ItemDer.LineY))
        {
            return true;
        }
        else if (i == 0)//如果虽然这二边连不通。但这二点已是最边点了。说明可连
        {
            return true;
        }
    }

    //向右检查查
    //因为item1的X值小，所以从item1开始向右延伸
    for (var i = item1.Position.X + 1; i < this.MaxBackGridSplits.X; i++)
    {
        var p1 = new Point(i, item1.Position.Y);
        var p2 = new Point(i, item2.Position.Y);
        //如果右点不为空。则此方向不可行
        if (!this.CheckPointIsEmpty(p1.X,p1.Y))
        {
            break;
        }
        //如果右点下方与item2水平的点不为空，则此线不行。进行下一个
        if (!p2.Equal(item2.Position) && !this.CheckPointIsEmpty(p2.X,p2.Y))
        {
            //如果i已经到item2的右边了，则此方向不可以再连通了
            if (i > item2.Position.X)
            {
                break;
            }
            continue;
        }
        //如果p2与item2之间的连线为空且p1与p2之间的连线为空
        //则这二点可以连线
        if (this.CheckInPointsIsEmpty(p2, item2.Position, ItemDer.LineX) && this.CheckInPointsIsEmpty(p1, p2, ItemDer.LineY))
        {
            return true;
        }
        //如果虽然这二边连不通。但这二点已是最边点了。说明可连
        else if (i == this.MaxBackGridSplits.X - 1)
        {
            return true;
        }
    }

    //向上检查查
    //因为item2的Y值大，所以从item2开始向上延伸
    for (var i = item2.Position.Y - 1; i >= 0; i--)
    {
        var p1 = new Point(item2.Position.X,i);
        var p2 = new Point(item1.Position.X,i);
        //如果上点不为空。则此方向不可行
        if (!this.CheckPointIsEmpty(p1.X,p1.Y))
        {
            break;
        }
        //如果上点左方与item1垂直的点不为空，则此线不行。进行下一个
        if (!p2.Equal(item1.Position) && !this.CheckPointIsEmpty(p2.X,p2.Y))
        {
            //如果i已经到item1的上边了，则此方向不可以再连通了
            if (i < item1.Position.Y)
            {
                break;
            }
            continue;
        }
        //如果p2与item1之间的连线为空且p1与p2之间的连线为空
        //则这二点可以连线
        if (this.CheckInPointsIsEmpty(p2, item1.Position, ItemDer.LineY) && this.CheckInPointsIsEmpty(p1, p2, ItemDer.LineX))
        {
            return true;
        }
        else if (i == 0)//如果虽然这二边连不通。但这二点已是最边点了。说明可连
        {
            return true;
        }
    }

    //向下检查查
    //因为item1的Y值小，所以从item1开始向下延伸
    for (var i = item1.Position.Y + 1; i < this.MaxBackGridSplits.Y; i++)
    {
        var p1 = new Point(item1.Position.X,i);
        var p2 = new Point(item2.Position.X,i);

        //如果下点不为空。则此方向不可行
        if (!this.CheckPointIsEmpty(p1.X,p1.Y))
        {
            break;
        }
        //如果下点下方与item2垂直的点不为空，则此线不行。进行下一个
        if (!p2.Equal(item2.Position) && !this.CheckPointIsEmpty(p2.X,p2.Y))
        {
            //如果i已经到item2的下边了，则此方向不可以再连通了
            if (i > item2.Position.Y)
            {
                break;
            }
            continue;
        }
        //如果p2与item2之间的连线为空且p1与p2之间的连线为空
        //则这二点可以连线
        if (this.CheckInPointsIsEmpty(p2, item2.Position, ItemDer.LineY) && this.CheckInPointsIsEmpty(p1, p2, ItemDer.LineX))
        {
            return true;
        }
        //如果虽然这二边连不通。但这二点已是最边点了。说明可连
        else if (i == this.MaxBackGridSplits.Y - 1)
        {
            return true;
        }
    }

    return false;
}


/// 在同一Y轴上的判断       
Engine.prototype.CheckLineY=function(item1, item2)
{
    //判断二点间的直线是否可连,或为最左边,或为最右边
    if (this.CheckInPointsIsEmpty(item1.Position, item2.Position, ItemDer.LineY) || (item1.Position.X == 0 && item2.Position.X == 0) ||
        (item1.Position.X == this.MaxBackGridSplits.X - 1 && item2.Position.X == this.MaxBackGridSplits.X - 1))
    {
        return true;
    }

    //向左开始判断
    //每次向左伸一个编移量，如果有连通的则可以连
    for (var i = item1.Position.X - 1; i >= 0; i--)
    {
        var p1 = new Point(i, item1.Position.Y);
        var p2 = new Point(i, item2.Position.Y);
        //如果这二点有任意一点不为空
        //则向左的方向不可行
        if (!this.CheckPointIsEmpty(p1.X,p1.Y) || !this.CheckPointIsEmpty(p2.X,p2.Y)) break;

        if (this.CheckInPointsIsEmpty(p1, p2, ItemDer.LineY)) //如果它们之间为空
        {
            return true;
        }

        if (i == 0)//如果这二点为最左边，所以可以连
        {
            return true;
        }
    }

    //向右开始判断
    //每次向右伸一个编移量，如果有连通的则可以连
    for (var i = item1.Position.X + 1; i <= this.MaxBackGridSplits.X - 1; i++)
    {
        var p1 = new Point(i, item1.Position.Y);
        var p2 = new Point(i, item2.Position.Y);
        //如果这二点有任意一点不为空
        //则向右的方向不可行
        if (!this.CheckPointIsEmpty(p1.X,p1.Y) || !this.CheckPointIsEmpty(p2.X,p2.Y)) break;

        if (this.CheckInPointsIsEmpty(p1, p2, ItemDer.LineY)) //如果它们之间为空
        {
            return true;
        }

        if (i == this.MaxBackGridSplits.X - 1)//如果这二点为最右，所以可以连
        {
            return true;
        }
    }

    return false;
}


/// 在同一X轴上的判断      
Engine.prototype.CheckLineX=function(item1, item2)
{
    //判断二点间的直线是否可连,或为最顶部点,或为最底部点
    if (this.CheckInPointsIsEmpty(item1.Position, item2.Position, ItemDer.LineX) || (item1.Position.Y == 0 && item2.Position.Y == 0) ||
        (item1.Position.Y == this.MaxBackGridSplits.Y - 1 && item2.Position.Y == this.MaxBackGridSplits.Y - 1))
    {
        return true;
    }

    //向上开始判断
    //每次向上伸一个编移量，如果有连通的则可以连
    for (var i = item1.Position.Y - 1; i >= 0 ; i--)
    {
        var p1=new Point(item1.Position.X, i);
        var p2=new Point(item2.Position.X, i);
        //如果这二点有任意一点不为空
        //则向上的方向不可行
        if (!this.CheckPointIsEmpty(p1.X,p1.Y) || !this.CheckPointIsEmpty(p2.X,p2.Y)) break;

        if (this.CheckInPointsIsEmpty(p1, p2, ItemDer.LineX)) //如果它们之间为空
        {
            return true;
        }

        if (i == 0)//如果这二点为最顶部，所以可以连
        {
            return true;
        }
    }

    //向上开始判断
    //每次向下伸一个编移量，如果有连通的则可以连
    for (var i = item1.Position.Y + 1; i <= this.MaxBackGridSplits.Y - 1; i++)
    {
        var p1 = new Point(item1.Position.X, i);
        var p2 = new Point(item2.Position.X, i);
        //如果这二点有任意一点不为空
        //则向下的方向不可行
        if (!this.CheckPointIsEmpty(p1.X,p1.Y) || !this.CheckPointIsEmpty(p2.X,p2.Y)) break;

        if (this.CheckInPointsIsEmpty(p1, p2, ItemDer.LineX)) //如果它们之间为空
        {
            return true;
        }

        if (i == this.MaxBackGridSplits.Y - 1)//如果这二点为最底部，所以可以连
        {
            return true;
        }
    }

    return false;
}


/// 判断二个点是否可以连       
Engine.prototype.IsCanLink=function(item1,item2)
{
    //如果二个图片不相同。则直接返回否.且如果二个为同一个也不可连
    if (!item1 || !item2 || !item1.Equal(item2)) return false;
    //获取这二点的方位
    var itemder = this.GetItemDer(item1, item2);
    switch (itemder)
    {
        case ItemDer.LineX://二点在同一X轴上
            {
                return this.CheckLineX(item1, item2);
            }
        case ItemDer.LineY://二点在同一Y轴上
            {
                return this.CheckLineY(item1, item2);
            }
        case ItemDer.LTRB://左上右下
            {
                return this.CheckLTRB(item1, item2);
            }
        case ItemDer.LBRT://左下右上
            {
                return this.CheckLBRT(item1, item2);
            }
    }
    return false;
}

window.llhengine = new Engine();
window.setInterval('window.llhengine.RefreshGreen()', window.llhengine.FPS); //定时刷新