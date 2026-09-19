package tjrs.dipred.orcamento.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import tjrs.dipred.orcamento.dto.AtualizacaoPrecoDTO;
import tjrs.dipred.orcamento.service.OrcamentoService;

@RestController
@RequestMapping("/api/admin/precos")
public class AdminPrecoController {

    private final OrcamentoService orcamentoService;

    public AdminPrecoController(OrcamentoService orcamentoService) {
        this.orcamentoService = orcamentoService;
    }

    @PostMapping("/atualizar-lote")
    public ResponseEntity<?> atualizarLote(@RequestBody List<AtualizacaoPrecoDTO> dados) {
        for (AtualizacaoPrecoDTO dado : dados) {
            try {
                orcamentoService.atualizarPreco(dado.getCodigo(), dado.getLote(), dado.getValor());
            } catch (Exception e) {
                System.out.println("Erro ao atualizar preço: " + dado + " - " + e.getMessage());
            }
        }
        return ResponseEntity.ok().build();
    }
}
