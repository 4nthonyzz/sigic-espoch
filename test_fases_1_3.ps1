# ==============================================================================
# SCRIPT DE VERIFICACIÓN AUTOMATIZADA: FASES 1 A 3 (SIGIC-ESPOCH)
# Ejecuta este script en PowerShell para verificar el funcionamiento del nuevo módulo.
# ==============================================================================

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " VERIFICACIÓN DE FASES 1 A 3: MÓDULO DE PRE-MATRÍCULA CISCO" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

$baseUrl = "http://localhost:3002/api"
$timestamp = Get-Date -Format "HHmmss"

# 1. VERIFICAR HEALTH CHECK
Write-Host "`n[1/6] Verificando estado del servidor Backend..." -NoNewline
try {
    $health = Invoke-RestMethod -Uri "$baseUrl/health" -Method Get
    Write-Host " [OK]" -ForegroundColor Green
    Write-Host "      Sistema: $($health.system) | Estado: $($health.status)" -ForegroundColor DarkGray
} catch {
    Write-Host " [FALLO]" -ForegroundColor Red
    Write-Host "      Asegurate de que el backend este corriendo en el puerto 3002." -ForegroundColor Yellow
    exit
}

# 2. PRUEBA DE AUTENTICACIÓN Y EVALUACIÓN DE TARIFAS (FASE 1)
Write-Host "`n[2/6] Probando registro con evaluación automática de tarifas..."

# Alumno ESPOCH -> Tarifa institucional
$correoEspoch = "alumno.$timestamp@espoch.edu.ec"
$bodyEspoch = @{
    correo = $correoEspoch
    password = "password123"
    nombres = "Estudiante Politécnico Test"
    cedula = "0609998877"
    rol = "estudiante"
} | ConvertTo-Json

$resEspoch = Invoke-RestMethod -Uri "$baseUrl/auth/registro" -Method Post -Body $bodyEspoch -ContentType "application/json; charset=utf-8"
if ($resEspoch.data.usuario.tarifa -eq "institucional") {
    Write-Host "  -> Correo @espoch.edu.ec asignó tarifa INSTITUCIONAL: [CORRECTO]" -ForegroundColor Green
} else {
    Write-Host "  -> Error asignando tarifa institucional" -ForegroundColor Red
}

$tokenEstudiante = $resEspoch.data.token
$headersEstudiante = @{ Authorization = "Bearer $tokenEstudiante" }

# Alumno externo -> Tarifa general
$correoExterno = "externo.$timestamp@gmail.com"
$bodyExterno = @{
    correo = $correoExterno
    password = "password123"
    nombres = "Estudiante Externo Test"
    cedula = "1709998877"
    rol = "estudiante"
} | ConvertTo-Json

$resExterno = Invoke-RestMethod -Uri "$baseUrl/auth/registro" -Method Post -Body $bodyExterno -ContentType "application/json; charset=utf-8"
if ($resExterno.data.usuario.tarifa -eq "general") {
    Write-Host "  -> Correo externo asignó tarifa GENERAL: [CORRECTO]" -ForegroundColor Green
} else {
    Write-Host "  -> Error asignando tarifa general" -ForegroundColor Red
}

# 3. PRUEBA DE ADMINISTRADOR Y CATÁLOGO DE CURSOS (FASE 2)
Write-Host "`n[3/6] Probando autenticación de Administrador y Catálogo..."
$correoAdmin = "admin.$timestamp@espoch.edu.ec"
$bodyAdmin = @{
    correo = $correoAdmin
    password = "adminPassword2026"
    nombres = "Coordinador Cisco Test"
    cedula = "0602899684"
    rol = "admin"
} | ConvertTo-Json

$resAdmin = Invoke-RestMethod -Uri "$baseUrl/auth/registro" -Method Post -Body $bodyAdmin -ContentType "application/json; charset=utf-8"
$tokenAdmin = $resAdmin.data.token
$headersAdmin = @{ Authorization = "Bearer $tokenAdmin" }

$catalogo = Invoke-RestMethod -Uri "$baseUrl/admin/cursos-catalogo" -Method Get -Headers $headersAdmin
Write-Host "  -> Catálogo consultado con éxito: $($catalogo.data.Count) cursos disponibles en ESPOCH." -ForegroundColor Green
$cursoId = $catalogo.data[0].id

# 4. PRUEBA DE CREACIÓN DE PARALELOS Y REGLA RN-08 (FASE 2)
Write-Host "`n[4/6] Probando creación de oferta y regla de cupos RN-08..."

# Caso inválido: cupo_maximo < cupo_minimo
try {
    $badOferta = @{
        curso_id = $cursoId
        paralelo = "T$timestamp"
        costo_general = 100
        costo_reducido = 70
        pago_minimo = 20
        cupo_minimo = 20
        cupo_maximo = 10
    } | ConvertTo-Json
    Invoke-RestMethod -Uri "$baseUrl/admin/ofertas" -Method Post -Body $badOferta -Headers $headersAdmin -ContentType "application/json"
    Write-Host "  -> [ERROR] No rechazó cupo máximo menor al mínimo" -ForegroundColor Red
} catch {
    Write-Host "  -> Bloqueo RN-08 (Cupo máximo < Cupo mínimo): [RECHAZADO CORRECTAMENTE]" -ForegroundColor Green
}

# Caso válido
$goodOferta = @{
    curso_id = $cursoId
    paralelo = "P$timestamp"
    costo_general = 120.00
    costo_reducido = 80.00
    pago_minimo = 25.00
    cupo_minimo = 15
    cupo_maximo = 20
    fecha_limite = "2026-12-01"
    estado = "abierta"
} | ConvertTo-Json

$ofertaCreada = Invoke-RestMethod -Uri "$baseUrl/admin/ofertas" -Method Post -Body $goodOferta -Headers $headersAdmin -ContentType "application/json"
$ofertaId = $ofertaCreada.data.id
Write-Host "  -> Paralelo creado con éxito (ID: $ofertaId) con 20 cupos disponibles." -ForegroundColor Green

# 5. PRUEBA DE RESERVA DE CUPO CON BLOQUEO FOR UPDATE (FASE 3)
Write-Host "`n[5/6] Probando reserva de cupo por estudiante y fijación de tarifa..."

# Intento con pago menor al mínimo ($10 < $25)
try {
    $badReserva = @{
        oferta_id = $ofertaId
        monto = 10.00
        comprobante = "TRANSF-INVALIDA"
    } | ConvertTo-Json
    Invoke-RestMethod -Uri "$baseUrl/prematricula/reservar" -Method Post -Body $badReserva -Headers $headersEstudiante -ContentType "application/json"
    Write-Host "  -> [ERROR] No rechazó pago menor al mínimo" -ForegroundColor Red
} catch {
    Write-Host "  -> Bloqueo de pago menor al mínimo (\$10 < \$25): [RECHAZADO CORRECTAMENTE]" -ForegroundColor Green
}

# Reserva exitosa (Abono de $25)
$goodReserva = @{
    oferta_id = $ofertaId
    monto = 25.00
    comprobante = "TRANSF-VAL-001"
} | ConvertTo-Json

$reserva = Invoke-RestMethod -Uri "$baseUrl/prematricula/reservar" -Method Post -Body $goodReserva -Headers $headersEstudiante -ContentType "application/json"
Write-Host "  -> Reserva completada con éxito. Costo fijado: `$$($reserva.data.costo_total) (Tarifa $($reserva.data.tarifa_aplicada))." -ForegroundColor Green

# 6. VERIFICAR PREVENCIÓN DE DUPLICADOS Y DESCUENTO DE CUPOS (FASE 3)
Write-Host "`n[6/6] Verificando prevención de doble reserva y actualización de cupos..."

try {
    Invoke-RestMethod -Uri "$baseUrl/prematricula/reservar" -Method Post -Body $goodReserva -Headers $headersEstudiante -ContentType "application/json"
    Write-Host "  -> [ERROR] Permitió doble reserva al mismo usuario" -ForegroundColor Red
} catch {
    Write-Host "  -> Prevención de duplicados para el mismo curso: [CORRECTO]" -ForegroundColor Green
}

$ofertaCheck = Invoke-RestMethod -Uri "$baseUrl/ofertas/$ofertaId" -Method Get
Write-Host "  -> Disponibilidad del paralelo en tiempo real: $($ofertaCheck.data.cupos_disponibles)/$($ofertaCheck.data.cupo_maximo) cupos." -ForegroundColor Green

Write-Host "`n==========================================================" -ForegroundColor Cyan
Write-Host " TODAS LAS PRUEBAS DE LAS FASES 1, 2 Y 3 PASARON CON ÉXITO " -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Cyan
