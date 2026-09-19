package tjrs.dipred.orcamento.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ComarcaDTO {
    private String comarca;
    private Integer lote;
    private String regiao;
}
