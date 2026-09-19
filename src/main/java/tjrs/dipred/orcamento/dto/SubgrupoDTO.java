package tjrs.dipred.orcamento.dto;

import java.util.List;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SubgrupoDTO {
    private String codigo;
    private String nome;
    private List<ItemDTO> itens;
    private Boolean virtual;
}
