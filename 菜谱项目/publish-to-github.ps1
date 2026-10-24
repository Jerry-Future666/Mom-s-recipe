<#
  妈妈的菜谱 · 一键发布到 GitHub Pages
  ==================================================================
  不需要安装 git，也不需要 github 命令行工具。
  这个脚本用 GitHub 官方 API 把本文件夹里的网站文件上传到你的仓库，
  并顺便打开 GitHub Pages。

  用法（任选其一）：
    1) 双击同目录下的 publish.bat                ← 最省事
    2) 右键本文件 → 使用 PowerShell 运行
    3) 命令行：
       powershell -NoProfile -ExecutionPolicy Bypass -File publish-to-github.ps1

  可选参数：
    -Repo   https://github.com/你的用户名/仓库名   （不填会提示你粘贴）
    -Token  访问令牌（不填会安全提示你粘贴；输入时不显示，也不会被保存到任何文件）
    -Proxy  http://127.0.0.1:7890                  （连不上 GitHub 时填你的代理地址）
    -DryRun 只列出将要上传的文件，不做任何网络请求

  说明：
    · 上传是「有则更新、无则新建」，所以以后改完菜谱再跑一次就是更新网站
    · 脚本自己（publish-to-github.ps1 / publish.bat）不会被上传到仓库
#>
[CmdletBinding()]
param(
  [string]$Repo,
  [string]$Token,
  [string]$Proxy,
  [switch]$DryRun
)

$ErrorActionPreference = 'Stop'
try { [Console]::OutputEncoding = [System.Text.Encoding]::UTF8 } catch { }
try { [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12 } catch { }

function Say([string]$msg, [string]$color) {
  if ($color) { Write-Host $msg -ForegroundColor $color } else { Write-Host $msg }
}

$root = $PSScriptRoot
if (-not $root) { $root = (Get-Location).Path }
$toolFiles = @('publish-to-github.ps1', 'publish.bat')

Say ''
Say '==================================================' 'Cyan'
Say '  妈妈的菜谱 · 发布到 GitHub Pages' 'Cyan'
Say '==================================================' 'Cyan'

# ---------------------------------------------------------------- 1. 仓库地址
if (-not $Repo -or $Repo.Trim() -eq '') {
  Say ''
  Say '请粘贴你的 GitHub 仓库地址（形如 https://github.com/zhangsan/mama-recipe）' 'Yellow'
  $Repo = Read-Host '仓库地址'
}
$Repo = $Repo.Trim()

$owner = $null
$repoName = $null
if ($Repo -match 'github\.com[:/]+([^/]+)/([^/#?]+)') {
  $owner = $Matches[1]
  $repoName = $Matches[2] -replace '\.git$', ''
} elseif ($Repo -match '^([\w.-]+)/([\w.-]+)$') {
  $owner = $Matches[1]
  $repoName = $Matches[2]
}
if (-not $owner -or -not $repoName) {
  Say ''
  Say ("地址看不懂：{0}" -f $Repo) 'Red'
  Say '应该像 https://github.com/你的用户名/mama-recipe' 'Red'
  exit 1
}

# ---------------------------------------------------------------- 2. 收集要上传的文件
$files = @()
Get-ChildItem -LiteralPath $root -Recurse -File -Force | ForEach-Object {
  $rel = $_.FullName.Substring($root.Length).TrimStart('\').Replace('\', '/')
  if ($toolFiles -contains $_.Name) { return }
  if ($rel -like '.git/*' -or $rel -eq '.git') { return }
  $files += [PSCustomObject]@{ Full = $_.FullName; Rel = $rel; Size = $_.Length }
}

if ($files.Count -eq 0) {
  Say ''
  Say '这个文件夹里没有找到要上传的文件。' 'Red'
  exit 1
}

if ($DryRun) {
  Say ''
  Say ("仓库：{0}/{1}" -f $owner, $repoName) 'Cyan'
  Say ("将要上传 {0} 个文件：" -f $files.Count) 'Cyan'
  foreach ($f in $files) {
    Say ("  {0,-26} {1,8} 字节" -f $f.Rel, $f.Size) 'Gray'
  }
  Say ''
  Say '（DryRun：没有做任何网络请求）' 'Yellow'
  exit 0
}

# ---------------------------------------------------------------- 3. 访问令牌
if (-not $Token -or $Token.Trim() -eq '') {
  Say ''
  Say '需要一个 GitHub 访问令牌（只在本次运行中使用，不会写入任何文件）' 'Yellow'
  Say '生成方法：GitHub → 右上角头像 → Settings → Developer settings →' 'Gray'
  Say '          Personal access tokens → Tokens (classic) → Generate new token (classic)' 'Gray'
  Say '          勾选 repo 这一个权限，生成后复制那串字符' 'Gray'
  $sec = Read-Host '粘贴令牌（输入时不显示）' -AsSecureString
  $bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($sec)
  try { $Token = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr) }
  finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr) }
}
$Token = $Token.Trim()
if (-not $Token) {
  Say '没有输入令牌，已中止。' 'Red'
  exit 1
}

$headers = @{
  Authorization          = 'Bearer ' + $Token
  'User-Agent'           = 'mama-recipe-publisher'
  'Accept'               = 'application/vnd.github+json'
  'X-GitHub-Api-Version' = '2022-11-28'
}
$invokeArgs = @{ Headers = $headers; TimeoutSec = 60 }
if ($Proxy -and $Proxy.Trim() -ne '') { $invokeArgs['Proxy'] = $Proxy.Trim() }

$api = 'https://api.github.com/repos/' + $owner + '/' + $repoName

function ShowHttpError($err) {
  Say ''
  $status = $null
  try { $status = $err.Exception.Response.StatusCode.value__ } catch { }
  if ($status -eq 401) {
    Say '令牌无效或已过期（401）。请重新生成一个勾选了 repo 权限的令牌。' 'Red'
  } elseif ($status -eq 403) {
    Say '令牌权限不够或次数超限（403）。确认勾选了 repo 权限。' 'Red'
  } elseif ($status -eq 404) {
    Say '找不到这个仓库（404）。请确认仓库地址和用户名，以及令牌是否有权访问它。' 'Red'
  } elseif ($status -eq 409) {
    Say '仓库是空的且分支有问题（409）。先在网页上随便建一个文件，或把仓库建成带 README 的。' 'Red'
  } elseif ($status) {
    Say ("GitHub 返回错误 HTTP {0}" -f $status) 'Red'
  } else {
    Say '连不上 GitHub。' 'Red'
    Say '  · 如果你在国内网络，可能需要在参数里加 -Proxy http://127.0.0.1:端口' 'Yellow'
    Say '  · 或者改用 README 里「方式一：网页上传」（不用命令行）' 'Yellow'
  }
  Say ('原始错误：' + $err.Exception.Message) 'DarkGray'
}

# ---------------------------------------------------------------- 4. 校验仓库
Say ''
Say ("仓库：{0}/{1}" -f $owner, $repoName) 'Cyan'
$repoInfo = $null
try {
  $repoInfo = Invoke-RestMethod -Uri $api -Method Get @invokeArgs
} catch {
  ShowHttpError $_
  exit 1
}

$branch = $repoInfo.default_branch
if (-not $branch) { $branch = 'main' }
Say ("默认分支：{0}" -f $branch) 'Gray'
if ($repoInfo.private -eq $true) {
  Say '注意：这是私有仓库。免费账号的 GitHub Pages 只支持公开仓库。' 'Yellow'
  Say '      需要在仓库 Settings → General → 最下面把可见性改成 Public。' 'Yellow'
}

# ---------------------------------------------------------------- 5. 确认
Say ''
Say ("将要上传/更新 {0} 个文件：" -f $files.Count) 'Cyan'
foreach ($f in $files) { Say ("  {0}" -f $f.Rel) 'Gray' }
Say ''
$answer = Read-Host '确认上传吗？(y = 是，其它键 = 取消)'
if ($answer -ne 'y' -and $answer -ne 'Y') {
  Say '已取消，什么都没做。' 'Yellow'
  exit 0
}

# ---------------------------------------------------------------- 6. 逐个上传
Say ''
$done = 0
$failed = @()
foreach ($f in $files) {
  $rel = $f.Rel
  $url = $api + '/contents/' + $rel
  try {
    $b64 = [Convert]::ToBase64String([System.IO.File]::ReadAllBytes($f.Full))
    $body = @{
      message = 'update ' + $rel
      content = $b64
      branch  = $branch
    }
    # 远端已存在同名文件时必须带上它的 sha，否则会被拒绝
    $sha = $null
    try {
      $exist = Invoke-RestMethod -Uri $url -Method Get @invokeArgs
      if ($exist -and $exist.sha) { $sha = $exist.sha }
    } catch { }
    if ($sha) { $body['sha'] = $sha }

    Invoke-RestMethod -Uri $url -Method Put -Body ($body | ConvertTo-Json -Compress) `
      -ContentType 'application/json' @invokeArgs | Out-Null
    $done = $done + 1
    Say ("  [OK]   {0}" -f $rel) 'Green'
  } catch {
    $failed += $rel
    Say ("  [失败] {0}" -f $rel) 'Red'
    ShowHttpError $_
  }
}
Say ''
Say ("已完成 {0} / {1} 个文件" -f $done, $files.Count) 'Cyan'

# ---------------------------------------------------------------- 7. 打开 Pages
$pagesReady = $false
try {
  $pagesBody = @{ source = @{ branch = $branch; path = '/' } } | ConvertTo-Json -Compress
  Invoke-RestMethod -Uri ($api + '/pages') -Method Post -Body $pagesBody `
    -ContentType 'application/json' @invokeArgs | Out-Null
  Say '已为你开启 GitHub Pages。' 'Green'
  $pagesReady = $true
} catch {
  $status = $null
  try { $status = $_.Exception.Response.StatusCode.value__ } catch { }
  if ($status -eq 409) {
    Say '（Pages 之前已经开过了，不用重复开）' 'Gray'
    $pagesReady = $true
  } else {
    Say '自动开启 Pages 没成功，需要你手动点两下：' 'Yellow'
    Say '  仓库页面 → Settings → 左侧 Pages → Source 选 Deploy from a branch' 'Yellow'
    Say ("  → Branch 选 {0} + / (root) → Save" -f $branch) 'Yellow'
  }
}

$site = 'https://' + $owner + '.github.io/' + $repoName + '/'
if ($repoName -ieq ($owner + '.github.io')) { $site = 'https://' + $owner + '.github.io/' }

Say ''
Say '==================================================' 'Cyan'
Say ("网站地址：{0}" -f $site) 'Cyan'
Say '==================================================' 'Cyan'
if ($pagesReady) {
  Say '第一次发布需要等 1～2 分钟，然后手机浏览器打开这个地址即可。' 'Gray'
}
if ($failed.Count -gt 0) {
  Say ''
  Say '下面这些文件没上传成功，可以再跑一次本脚本：' 'Red'
  foreach ($x in $failed) { Say ('  ' + $x) 'Red' }
}
Say ''
Say '以后改完菜谱，再双击一次 publish.bat 就是更新网站。' 'Gray'
Say ''
