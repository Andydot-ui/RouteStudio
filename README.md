# RouteStudio

面向 DJI 无人机的纯前端正射航线规划器。界面按 Windows 11 Fluent 设计规范实现，支持浅色/深色主题、本地任务保存，以及 DJI WPML KMZ 导入导出。

## 功能

- 正射面状航线：连续点选绘制区域边界，双击或点击完成，按相机幅宽与重叠率自动生成航拍航线
- 地图交互：点选与拖动控制点、航点编号、相机视锥、逐航点预览，底图为 Esri 全球卫星影像（可开关叠加 OSM 路名注记）与 OpenStreetMap 街道地图（中文注记），均为 WGS 84 原生坐标且无水印
- 航测参数：相对起飞点高度、巡航速度、航向与旁向重叠率、最大航点间距、可选手动行距、云台俯仰、航线方向
- 自动航线方向：默认沿区域长边布设扫描线，按实际航程最短选取方向，可在需要时改回手动指定角度
- 到点动作：飞越拍摄（不减速连续过点，正射常用）与悬停拍摄两种模式，导出对应的 DJI `waypointTurnMode`
- 机头朝向：沿航线方向、固定方向、手动三种模式，导出对应的 DJI `waypointHeadingMode`
- 角度输入：航线方向、机头朝向、云台俯仰均为可拖动表盘，支持方向键微调与数字输入
- 相机配置：25 款 DJI 机型（Mavic、Mini、Air、Phantom、Inspire、Matrice 系列）与通用 DJI 航点
- DJI 文件：导入 `KMZ/KML/WPML`，导出 `wpmz/template.kml` 与 `wpmz/waylines.wpml`
- 本地任务库：任务草稿、撤销重做、保存和导入导出均在浏览器完成
- 快捷键：`Ctrl+Z` 撤销、`Ctrl+Shift+Z` 重做、`Ctrl+S` 保存、`Ctrl+E` 导出 KMZ、`[` `]` 逐个预览航点、`Delete` 删除控制点、`Esc` 退出绘制
- 主题：浅色/深色切换，首次访问跟随系统外观，手动选择后持久保存

## 本地运行

```bash
npm install
npm run dev
```

生产构建和本地预览：

```bash
npm run build
npm run preview
```

## GitHub Pages 部署

项目已经部署地址：[https://andydot-ui.github.io/RouteStudio/](https://andydot-ui.github.io/RouteStudio/)，并包含 [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)。将项目推送到 GitHub 的 `main` 或 `master` 分支后，在仓库的 **Settings → Pages** 中把 Source 设为 **GitHub Actions**。之后每次推送都会自动构建并发布 `dist`。

Vite 使用相对资源路径（`base: './'`），因此可以在 `https://<user>.github.io/<repo>/` 子路径下直接运行。

## DJI KMZ 兼容说明

导出文件遵循 DJI WPML 1.0.2 的目录结构和主要字段，包括坐标、`relativeToStartPoint` 相对高度、航向、转弯参数、拍照动作与云台旋转动作。导入时会保留原航点顺序、高度、俯仰与动作。

`wpmz/template.kml` 按 DJI Fly 实飞样例的完整结构输出：`missionConfig` 含起飞安全高度，`Folder` 内含坐标系参数、载荷参数、全局机头参数与全部航点镜像；`wpmz/waylines.wpml` 写入真实的任务里程与时长，供 DJI Fly 任务列表显示。导入时会回读转弯模式、起飞安全高度与结束动作，重新导出不会丢失这些设置。

相机幅宽按机身实际安装方向计算：传感器长边垂直于航向，决定旁向行距；短边沿航向，决定拍照间隔。导出的航向与转弯模式与小曲天绘 v1.7 等实飞验证过的样例逐字段一致，同样区域、同样重叠率下生成 72 个航点，与本项目测试的参考文件完全相同，航程 2.30 km 优于其 2.70 km。

地图数据全程使用 WGS 84 经纬度，底图瓦片同样是 WGS 84 原生投影，因此点击取点、屏幕显示与导出文件三者共用同一坐标，应用内不做任何坐标系纠偏。高德、百度等国内瓦片会把影像整体偏移（GCJ-02 / BD-09 加密），若换用这类底图就必须对每个坐标做正反两次换算，任何一处公式偏差都会让无人机落到错误位置，所以本项目不采用。DJI WPML 导入导出不依赖后端服务。使用航测成果前，请在实际飞行环境中核验禁飞区、障碍物和当地飞行法规。

早期版本使用高德底图，其 GCJ-02 换算存在缺陷，绘制的航线会整体偏东约 120 m。当前版本已改用 WGS 84 原生底图，并在首次读取本地存档时自动修正这批历史数据（依据存档时间与来源区分，公式修复后绘制的数据与 KMZ 导入的数据不会被改动）。

## 技术栈

React 19、TypeScript、Vite、Leaflet、fflate、lucide-react。界面样式为原生 CSS 设计令牌，无 UI 组件库依赖，字体使用系统 Segoe UI Variable，不加载远程字体。
