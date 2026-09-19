package tjrs.dipred.orcamento.dto;

import java.math.BigDecimal;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AtualizacaoPrecoDTO {
    private String codigo;
    private Integer lote;
    private BigDecimal valor;
}
