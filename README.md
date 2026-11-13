# RouteStudio

面向 DJI 无人机的纯前端航点航线规划器。支持浅色/深色主题、二维/三维预览、本地任务保存，以及 DJI WPML KMZ 导入导出。

## 功能

- 六类航线：自定义航点、单条航线、航带航线、面状航线、倾斜航线、环绕航线
- 地图交互：点选、拖动控制点、航点编号、相机视锥、卫星/街道/地形底图
- 航测参数：相对起飞点高度、速度、重叠率、行距、拍照间距、云台俯仰、主航线旋转
- 相机配置：Mini 4 Pro、Air 3S、Mavic 3E、Mavic 3M 与通用 DJI 航点
- DJI 文件：导入 `KMZ/KML/WPML`，导出 `wpmz/template.kml` 与 `wpmz/waylines.wpml`
- 本地任务库：任务草稿、撤销重做、保存和导入导出均在浏览器完成
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

地图使用 WGS 84 经纬度。DJI WPML 导入导出不依赖后端服务。使用航测成果前，请在实际飞行环境中核验地图底图偏差、禁飞区、障碍物和当地飞行法规。

## 技术栈

React 19、TypeScript、Vite、Leaflet、fflate、lucide-react。
