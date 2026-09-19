package tjrs.dipred.orcamento.dto;

import java.util.List;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class GrupoDTO {
    private String codigo;
    private String nome;
    private List<SubgrupoDTO> subgrupos;
}
