package tjrs.dipred.orcamento.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import tjrs.dipred.orcamento.dto.ComarcaDTO;
import tjrs.dipred.orcamento.dto.GrupoDTO;
import tjrs.dipred.orcamento.dto.LoteDTO;
import tjrs.dipred.orcamento.service.OrcamentoService;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class OrcamentoController {

    private final OrcamentoService orcamentoService;

    public OrcamentoController(OrcamentoService orcamentoService) {
        this.orcamentoService = orcamentoService;
    }

    @GetMapping("/comarcas")
    public ResponseEntity<List<ComarcaDTO>> listarComarcas() {
        return ResponseEntity.ok(orcamentoService.listarComarcas());
    }

    @GetMapping("/lotes")
    public ResponseEntity<List<LoteDTO>> listarLotes() {
        return ResponseEntity.ok(orcamentoService.listarLotes());
    }

    @GetMapping("/itens-orcamento")
    public ResponseEntity<List<GrupoDTO>> listarItensOrcamento() {
        return ResponseEntity.ok(orcamentoService.listarItensOrcamento());
    }
}
