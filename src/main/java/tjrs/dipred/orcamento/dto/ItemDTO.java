package tjrs.dipred.orcamento.dto;

import java.math.BigDecimal;
import java.util.List;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ItemDTO {
    private String codigo;
    private String descricao;
    private String unidade;
    private List<BigDecimal> precos;
}
