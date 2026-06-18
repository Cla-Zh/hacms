# 出处 URL 验证报告 (修订版)

**验证日期**: 2026-06-18
**验证方法**: 由于沙箱环境网络限制 (Wikipedia 域名全部 timeout), 实际网络验证无法完成
**采用方案**: **静态 URL 模式验证** —— 检查 URL 是否符合标准 Wikipedia / 权威域名格式, 域名分布统计

---

## 静态验证结果

| 指标 | 数值 | 占比 |
|---|---|---|
| 总记录数 | 1553 | 100% |
| URL 格式有效 (http/https + 域名) | 1553 | 100.0% |
| URL 格式异常 | 0 | 0.00% |
| Wikipedia 标准格式匹配 | 1347 | 86.7% |
| 非 Wikipedia 来源 | 206 | 13.3% |

## 数据源分布 (前 20)

| 域名 | 记录数 |
|---|---|
| `en.wikipedia.org` | 1347 |
| `github.com` | 15 |
| `learn.microsoft.com` | 11 |
| `www.fileinfo.com` | 9 |
| `man.openbsd.org` | 7 |
| `www.freedesktop.org` | 7 |
| `www.jetbrains.com` | 7 |
| `developer.apple.com` | 6 |
| `www.mathworks.com` | 6 |
| `cran.r-project.org` | 6 |
| `www.gnu.org` | 5 |
| `docs.docker.com` | 5 |
| `doc.qt.io` | 5 |
| `vtk.org` | 5 |
| `docs.gradle.org` | 4 |
| `go.dev` | 3 |
| `eslint.org` | 3 |
| `nmap.org` | 3 |
| `hex-rays.com` | 3 |
| `linux.die.net` | 3 |

## 非 Wikipedia 来源 (前 10 条样本)

- `._test.go` — https://go.dev/doc/code#Testing
- `._test.py` — https://docs.pytest.org/
- `.abi` — https://developer.android.com/ndk/guides/abis
- `.acsl` — https://www.frama-c.com/
- `.adml` — https://learn.microsoft.com/en-us/troubleshoot/windows-server/group-policy/create-or-edit-administrative-template-files
- `.admx` — https://learn.microsoft.com/en-us/troubleshoot/windows-server/group-policy/create-or-edit-administrative-template-files
- `.annoy` — https://github.com/spotify/annoy
- `.arsc` — https://source.android.com/devices/tech/dalvik/
- `.authorized_keys` — https://man.openbsd.org/sshd
- `.automount` — https://www.freedesktop.org/software/systemd/man/systemd.automount.html

---

## 网络环境限制说明

**沙箱网络环境 (curl 测试结果)**:

| 测试 URL | 结果 |
|---|---|
| `https://www.baidu.com` | HTTP 200 ✅ |
| `https://www.iana.org` | HTTP 200 ✅ |
| `https://example.com` | HTTP 200 ✅ |
| `https://en.wikipedia.org/wiki/JPEG` | **timeout (15s)** ❌ |
| `https://en.m.wikipedia.org/wiki/JPEG` | **timeout** ❌ |
| `https://zh.wikipedia.org/wiki/JPEG` | **timeout** ❌ |
| `https://www.google.com` | timeout ❌ |

**结论**: 沙箱环境屏蔽了 Wikipedia 全域名 + Google。因此 100 条抽样的网络测试不可执行。

**实际数据可信度评估**:
- 1347/1553 (86.7%) 是标准 Wikipedia URL 格式 (`https://{lang}.wikipedia.org/wiki/{Title}`)
- 100% 的 URL 都有 `http://` 或 `https://` 前缀
- 子代理在调研时 web_search + web_extract 工具能成功抓取 Wikipedia 内容, 所以 URL 在生成时是有效的

**建议**:
1. 用户在本地或服务器 (有 Wikipedia 访问权限的环境) 重跑 `curl -sI -A "Mozilla/5.0" <URL>` 验证
2. 抽样建议: 至少从每个 CSV 文件 (images_docs / media_exe / data_systems) 各抽 10-20 条
3. 如果有 4xx 错误, 标记需修正

## 抽样详情 (格式验证前 20)

| 扩展名 | 域名 | 格式 | URL |
|---|---|---|---|
| `.0000` | en.wikipedia.org | ✓ | https://en.wikipedia.org/wiki/File_splitting |
| `.0001` | en.wikipedia.org | ✓ | https://en.wikipedia.org/wiki/File_splitting |
| `.0002` | en.wikipedia.org | ✓ | https://en.wikipedia.org/wiki/File_splitting |
| `.0003` | en.wikipedia.org | ✓ | https://en.wikipedia.org/wiki/File_splitting |
| `.0004` | en.wikipedia.org | ✓ | https://en.wikipedia.org/wiki/File_splitting |
| `.0005` | en.wikipedia.org | ✓ | https://en.wikipedia.org/wiki/File_splitting |
| `.0006` | en.wikipedia.org | ✓ | https://en.wikipedia.org/wiki/File_splitting |
| `.0007` | en.wikipedia.org | ✓ | https://en.wikipedia.org/wiki/File_splitting |
| `.0008` | en.wikipedia.org | ✓ | https://en.wikipedia.org/wiki/File_splitting |
| `.0009` | en.wikipedia.org | ✓ | https://en.wikipedia.org/wiki/File_splitting |
| `.001` | en.wikipedia.org | ✓ | https://en.wikipedia.org/wiki/File_splitting |
| `.002` | en.wikipedia.org | ✓ | https://en.wikipedia.org/wiki/File_splitting |
| `.123` | en.wikipedia.org | ✓ | https://en.wikipedia.org/wiki/Lotus_1-2-3 |
| `.3dm` | en.wikipedia.org | ✓ | https://en.wikipedia.org/wiki/Rhinoceros_3D |
| `.3ds` | en.wikipedia.org | ✓ | https://en.wikipedia.org/wiki/.3ds |
| `.3fr` | en.wikipedia.org | ✓ | https://en.wikipedia.org/wiki/Raw_image_format |
| `.3g2` | en.wikipedia.org | ✓ | https://en.wikipedia.org/wiki/3GP |
| `.3ga` | en.wikipedia.org | ✓ | https://en.wikipedia.org/wiki/3GP |
| `.3gp` | en.wikipedia.org | ✓ | https://en.wikipedia.org/wiki/3GP |
| `.3gp2` | en.wikipedia.org | ✓ | https://en.wikipedia.org/wiki/3GP |
