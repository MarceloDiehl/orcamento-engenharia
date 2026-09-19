package tjrs.dipred.orcamento.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class LoteDTO {
    private Integer lote;
    private String empresa;
    private Integer contrato;
    private String regioes;
}
