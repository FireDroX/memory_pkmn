param(
  [string]$Source = "client/src/assets/seo/og-card-background.png",
  [string]$Output = "client/public/og-card.png"
)

Add-Type -AssemblyName System.Drawing

$sourcePath = [System.IO.Path]::GetFullPath($Source)
$outputPath = [System.IO.Path]::GetFullPath($Output)
$sourceImage = [System.Drawing.Image]::FromFile($sourcePath)
$canvas = New-Object System.Drawing.Bitmap 1200, 630
$canvas.SetResolution(96, 96)
$graphics = [System.Drawing.Graphics]::FromImage($canvas)
$graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$graphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit

try {
  $graphics.DrawImage($sourceImage, 0, 0, 1200, 630)

  $ink = [System.Drawing.ColorTranslator]::FromHtml("#13233f")
  $paper = [System.Drawing.ColorTranslator]::FromHtml("#fffdf6")
  $yellow = [System.Drawing.ColorTranslator]::FromHtml("#ffd64a")
  $red = [System.Drawing.ColorTranslator]::FromHtml("#ef5b5b")
  $mint = [System.Drawing.ColorTranslator]::FromHtml("#71d4bd")

  $paperBrush = New-Object System.Drawing.SolidBrush $paper
  $yellowBrush = New-Object System.Drawing.SolidBrush $yellow
  $redBrush = New-Object System.Drawing.SolidBrush $red
  $mintBrush = New-Object System.Drawing.SolidBrush $mint
  $inkBrush = New-Object System.Drawing.SolidBrush $ink
  $inkPen = New-Object System.Drawing.Pen $paper, 5
  $eAcute = [char]0x00C9

  $graphics.FillEllipse($redBrush, 72, 64, 54, 54)
  $graphics.FillPie($paperBrush, 77, 69, 44, 44, 0, 180)
  $graphics.DrawEllipse($inkPen, 72, 64, 54, 54)
  $graphics.DrawLine($inkPen, 74, 91, 124, 91)
  $graphics.FillEllipse($paperBrush, 92, 78, 14, 14)

  $brandFont = New-Object System.Drawing.Font "Arial", 58, ([System.Drawing.FontStyle]::Bold)
  $eyebrowFont = New-Object System.Drawing.Font "Arial", 17, ([System.Drawing.FontStyle]::Bold)
  $headlineFont = New-Object System.Drawing.Font "Arial", 42, ([System.Drawing.FontStyle]::Bold)
  $bodyFont = New-Object System.Drawing.Font "Arial", 20, ([System.Drawing.FontStyle]::Bold)

  $graphics.DrawString("POKE", $brandFont, $redBrush, 146, 54)
  $pokeWidth = $graphics.MeasureString("POKE", $brandFont).Width
  $graphics.DrawString("FLIP", $brandFont, $paperBrush, 140 + $pokeWidth, 54)

  $graphics.FillRectangle($yellowBrush, 76, 156, 225, 35)
  $graphics.DrawString("MEMORY BATTLE", $eyebrowFont, $inkBrush, 85, 161)

  $graphics.DrawString("RETOURNE.", $headlineFont, $paperBrush, 72, 225)
  $graphics.DrawString("M${eAcute}MORISE.", $headlineFont, $paperBrush, 72, 279)
  $graphics.DrawString("GAGNE.", $headlineFont, $yellowBrush, 72, 333)

  $graphics.FillRectangle($redBrush, 76, 432, 12, 70)
  $graphics.DrawString("SOLO + MULTIJOUEUR", $bodyFont, $paperBrush, 108, 433)
  $graphics.DrawString("EN TEMPS R${eAcute}EL", $bodyFont, $mintBrush, 108, 467)

  $graphics.DrawString("pokeflip.addrien.fr", $eyebrowFont, $paperBrush, 74, 553)

  $outputDirectory = [System.IO.Path]::GetDirectoryName($outputPath)
  [System.IO.Directory]::CreateDirectory($outputDirectory) | Out-Null
  $canvas.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
}
finally {
  $brandFont.Dispose()
  $eyebrowFont.Dispose()
  $headlineFont.Dispose()
  $bodyFont.Dispose()
  $paperBrush.Dispose()
  $yellowBrush.Dispose()
  $redBrush.Dispose()
  $mintBrush.Dispose()
  $inkBrush.Dispose()
  $inkPen.Dispose()
  $graphics.Dispose()
  $canvas.Dispose()
  $sourceImage.Dispose()
}
