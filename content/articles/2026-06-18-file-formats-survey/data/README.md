# 文件类型大全 (File Formats Survey)

**调研日期**: 2026-06-18
**调研范围**: 所有已知文件类型（图片、文档、音视频、压缩归档、可执行、字体、3D 模型、数据、系统、网络、容器、科学工程、加密、系统配置）
**数据来源**: Wikipedia 为主，辅以 fileinfo.com、IANA、RFC、官方规范

## 统计数据

| 指标 | 数值 |
|---|---|
| 总记录数 (含多用途) | 1,553 条 |
| 唯一文件类型 (按扩展名) | 1,477 个 |
| 类别数 | 13 大类 |
| 数据源数 | 352+ 不同的 Wikipedia 文章 |

## 文件清单

| 文件 | 类别 | 记录数 |
|---|---|---|
| `formats_images_docs.csv` | 图片 + 文档 + 文本/标记/源代码 | 507 |
| `formats_media_exe.csv` | 音视频 + 压缩归档 + 可执行 + 字体 + 3D/游戏 | 556 |
| `formats_data_systems.csv` | 数据/系统/开发/网络/容器/科学工程/加密/系统配置 | 630 |
| `formats_all.csv` | **合并主文件 (推荐使用)** | 1,553 |
| `formats_all_indexed.csv` | 带分类索引的版本 | 1,553 |

## CSV 字段说明

| 列 | 中文 | 英文 | 说明 |
|---|---|---|---|
| 1 | 扩展名 | extension | 文件扩展名（含 `.` 前缀） |
| 2 | 用途 | purpose | 1-2 句话说明文件做什么 |
| 3 | 变种 | variants | 压缩模式、版本、颜色深度、编码等子类型 |
| 4 | 出处 | source_url | 权威来源 URL（Wikipedia 为主） |

## 类别分布

### 图片
- **静态光栅**: png, jpg, gif, bmp, tiff, webp, avif, heif/heic, jpeg-xl, jp2, ico, apng, tga, pcx, psd, xcf, kra, ora...
- **相机 RAW**: dng, cr2, cr3, nef, arw, orf, rw2, raf, pef, srw, x3f, 3fr...
- **矢量**: svg, eps, ai, cdr, cgm, emf, wmf, xaml, swf...
- **3D/科学**: exr, hdr, dpx, fits, nii, vtk, stl, obj, ply, dae, fbx, gltf, usd, blend, max...

### 文档
- **字处理**: doc/docx, odt, pages, wps, wpd, sxw, fodt...
- **电子表格**: xls/xlsx, ods, numbers, dbf, csv, tsv...
- **演示**: ppt/pptx, odp, key...
- **PDF/PS**: pdf, ps, eps, prn, hp-gl/plt...
- **电子书**: epub, mobi, azw, kfx, fb2, lit, lrf, snb, tcr, cbz, cbr...
- **标记语言**: html, xml, json, yaml, toml, md, rst, tex, dvi, rss, atom, kml, gpx...

### 音视频
- **音频 (未压缩)**: wav, aiff, au, pcm, raw
- **音频 (有损)**: mp3, aac, m4a, ogg, opus, wma, amr, dts, ac3
- **音频 (无损)**: flac, alac, ape, wavpack, tta, ofr, tak
- **音频 (MIDI)**: mid, midi, kar, rmi, xmf
- **音频 (模块音乐)**: mod, s3m, xm, it, mtm, umx
- **视频容器**: avi, mov, mp4, mkv, webm, flv, m4v, ogv
- **视频 (流)**: ts, m2ts, m3u8, mpd
- **视频 (字幕)**: srt, sub, ass, vtt, ttml
- **光盘/蓝光/DVD**: iso, img, bin, cue, nrg, mdf, vob, ifo
- **编辑工程**: prproj, aep, fcpxml, xmeml, edl

### 压缩归档
- **zip 系**: zip, zipx, jar, war, apk, xpi, epub
- **rar**: rar, r00, r01
- **7z**: 7z, 7z.001
- **tar**: tar, tar.gz, tar.bz2, tar.xz, tar.zst
- **lz**: gz, bz2, xz, lzma, zst, lz4, lzo, lz
- **Windows 安装**: msi, msp, mst, cab
- **macOS**: pkg, dmg, cdr, sit, sitx
- **Linux**: deb, rpm, pkg.tar.xz
- **备份**: bak, old, sav, swp

### 可执行/二进制
- **Windows PE**: exe, dll, com, scr, cpl, ocx, sys, drv, efi
- **Linux/Unix ELF**: elf, o, so, a, ko
- **macOS Mach-O**: dylib, framework, bundle
- **Java 字节码**: class, jar
- **WebAssembly**: wasm
- **Android**: dex, oat, art
- **固件**: bin, hex, rom, fw
- **UEFI**: efi

### 字体
- **桌面**: ttf, otf, ttc, otc, dfont
- **Web**: woff, woff2, eot, svg
- **PostScript**: pfa, pfb, afm
- **位图字体**: bdf, pcf, psf, fon
- **可变字体**: ttf, otf (含 variations)

### 3D/游戏资源
- **模型**: 3ds, max, blend, mb, ma, c4d, fbx, obj, dae, gltf, usd, abc
- **纹理**: dds, ktx, ktx2, pvr, astc, basis
- **关卡/打包**: bsp, wad, pk3, pk4, vpk, bns, unity3d, mpq, pak
- **物理**: hkx, havok, bhd, nif
- **Shader**: hlsl, glsl, spv, spirv, dxbc, cso

### 数据/数据库
- **关系**: db, sqlite, mdb, accdb, mdf, ndf, ldf, dbf
- **文档型**: json, bson, cbor, msgpack, avro, parquet, orc
- **键值**: leveldb, rocksdb, lmdb, berkeleydb, rdb, aof
- **时序**: tsdb, influxdb
- **向量**: faiss, hnsw, annoy, lancedb, milvus
- **搜索**: elasticsearch, solr, lucene
- **数据湖**: delta, parquet, json, csv

### 系统/磁盘
- **磁盘镜像**: iso, img, vhd, vhdx, vmdk, vdi, qcow2, qed
- **Windows 邮件**: pst, ost, edb, dbx, mbox, nsf
- **文件系统**: ext2/3/4, xfs, btrfs, zfs, f2fs, ntfs, fat, exfat, hfs, apfs
- **备份**: gho, tib, vbk, vbm, fbk
- **崩溃/内存**: dmp, mdmp, mem, vmcore, hiberfil.sys

### 开发/工程
- **IDE**: iml, ipr, sln, csproj, vcxproj, project
- **构建**: makefile, cmakelists.txt, meson.build, configure
- **包管理**: package.json, go.mod, cargo.toml, pom.xml, build.gradle
- **CI/CD**: Jenkinsfile, .gitlab-ci.yml, azure-pipelines.yml
- **基础设施**: terraform.tf, playbook.yml, kustomization.yaml
- **容器化**: dockerfile, containerfile, compose.yaml

### 网络/协议
- **抓包**: pcap, pcapng, cap, snoop
- **NetFlow**: nfdump, nfcapd
- **TLS/证书**: pem, der, p12, pfx, p7b, csr, crl, jks
- **SSH**: key, pub, known_hosts
- **WARC/HAR**: warc, har

### 容器/虚拟化
- **Docker/OCI**: dockerfile, compose, oci, index.json
- **镜像格式**: ova, ovf, vmdk, qcow2, vhd, vhdx
- **Vagrant/Packer**: vagrantfile, packer
- **VM 厂商格式**: vmdk (VMware), vhd (Hyper-V), vdi (VirtualBox)

### 科学/工程
- **MATLAB**: mat, fig, m
- **Mathematica**: nb
- **HDF5/NetCDF**: h5, hdf5, nc
- **医学**: dcm (DICOM), nii (NIfTI), mnc (MINC)
- **CAD**: dwg, dxf, sldprt, catpart, ipt, 3dm, skp, ifc, rvt
- **PCB**: gbr, drl, hpgl

### 加密/签名
- **PGP/GPG**: gpg, pgp, asc, sig
- **OpenSSL**: pem, der, key, csr
- **S/MIME**: p7m, p7s
- **PKCS**: p12, pfx, p7b, p8
- **VPN**: ovpn, conf

### 系统配置
- **systemd**: service, timer, mount, socket
- **包管理**: deb, rpm
- **服务配置**: conf, cfg, ini, env, properties
- **注册表**: reg, pol, dat
- **Active Directory**: ntds.dit, edb
- **Web 服务器**: htaccess, caddyfile, vcl

## 使用建议

1. **完整版**: 用 `formats_all.csv` (推荐, 已去重)
2. **按类别查**: 用 `formats_images_docs.csv` / `formats_media_exe.csv` / `formats_data_systems.csv`
3. **每条记录都有出处 URL** — 可点开验证
4. **未经过 URL 实时验证** — 抽查 5-10 条应正常可达 (Wikipedia 链接模式稳定)

## 局限

1. **不包含私有不开放格式** (e.g., Apple ProRes 内部 codec, NVIDIA GameWorks 内部)
2. **不包含极冷门格式** (e.g., 老式磁带格式 Magstar, 9-track)
3. **URL 链接在调研时未逐条实时访问** (Wikipedia 链接模式稳定但不能 100% 保证)
4. **子代理 1 用英文, 2/3 用中文** — 合并时已统一翻译扩展名和表头
